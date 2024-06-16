---
title: Stochastic Processes as Monad Transformers
layout: layouts/post.njk
date: 2010-08-03
tags:
  - Haskell
  - Monad Transformers
  - Monads
  - Stochastic Processes
  - Probability Monad
  - posts
author: Rafael S. Calsaverini
---

I have a difficulty to understand functional programming concepts that I can’t put to some very simple and natural use (natural for me, of course). I need to find the perfect simple example to implement to finally understand something. And I’m not a computer scientist, so things like parsers and compilers have very little appeal to me (probably because I don’t understand them…). I’m a physicist, so this drives me to look for physical problems that can be implemented in Haskell so I can understand some concepts.

Monad transformers still eludes me. But I think I finally got the perfect subject were I can understand them: stochastic processes! First some book keeping:

```haskell
import Control.Monad.State
import Control.Monad
import Control.Monad.Rand
```

Now, stochastic processes have characteristics related to two different monads. In one hand, they are dynamical processes, and the way to implement dynamics in Haskell is with state monads. For example, if I want to iterate the logistic map:

$$
  x_{t+1} = \alpha x_t\left(1-x_t\right)
$$

I could do the following:

```haskell
  f :: Double -> Double
  f x = 4*x*(1-x)

  logistic :: State Double Double
  logistic = do x0 <- get
        let x1 = f x
        put x1
        return x1
  runLogistic :: State Double [Double]
  runLogistic n x0= evalState (replicateM n logistic) x0
```

Running this on ghci would give you, for example:

```haskell
  *Main> runLogistic 5 0.2
  [0.6400000000000001,0.9215999999999999,0.28901376000000045, 0.8219392261226504,0.5854205387341]
```

So we can make the loose correspondence: dynamical system ↔ state monad.

On the other hand, stochastic processes are compositions of random variables, and this is done with the Rand monad (found in `Control.Monad.Random`). As an example, the Box-Muller formula tells us that, if I have two inpendent random variables $x$ and $y$, distributed uniformly between in the \\([0, 1]\\) interval, then, the expression:

$$
  \sqrt{-2\log(x)}\cos(2\pi y)
$$

will be normally distributed. We can write then:

```haskell
boxmuller :: Double -> Double -> Double
boxmuller x y = sqrt(-2*log x)*cos(2*pi*y)

normal :: Rand StdGen Double  -- normally distributed
normal = do x <- getRandom
            y <- getRandom
            return $ boxmuller x y

normals n = replicateM n normal -- n independent samples from normal
```

Running this function we get what we need:

```haskell
*Main> (evalRand $ normals 5) (mkStdGen 0) =
[0.1600255836730147,0.1575360140445035,-1.595627933129274,
-0.18196791439834512,-1.082222285056746]
```

So what is a stochastic process? In very rough terms: is a dynamical system with random variables. So we need a way to make the `Rand` monad to talk nicely with the `State` monad. The way to do this is to use a monad transformer, in this case, the `StateT` transformer. Monad transformers allows you to combine the functionalities of two different monads. In the case of the `StateT` monads, they allow you to add a state to any other monad you want. In our case, we want to wrap the `Rand` monad inside a `StateT` transformer and work with things of type:

```haskell
foo ::  StateT s (Rand StdGen) r
```

This type represent a monad that can store a state with type s, like the state monad, and can generate random variables of type r, like the rand monad. In general we would have a type

```haskell
foo2 ::(MonadTrans t, Monad m) => t m a
```

In this case, `t = StateT s` and `m = Rand StdGen`. The class `MonadTrans` is defined in `Control.Monad.Trans`, and provides the function:

```haskell
lift :: (MonadTrans t, Monad m) => m a -> t m a
```

In this case, `t` is itself a monad, and can be treated like one through the code. It works like this: inside a do expression you can use the `lift` function to access the inner monad. Things called with lift will operate in the inner monad. Things called without `lift` will operate in the outer monad.

So, suppose we want to simulate this very simple process:

$$x_{t+1} = x_t + \eta_t$$

where \\(\eta_t\\) is drawn from a normal distribution. We would do:

```haskell
randomWalk :: StateT Double (Rand StdGen) Double
randomWalk = do eta <- lift normal
                x <- get
                let x' = x + eta
                put x'
                return x'
runWalk :: Int -> Double -> StdGen -> [Double]
runWalk n x0 gen = evalRand (replicateM n $ evalStateT randomWalk x0) gen
```

The `evalStateT` function is just evalState adapted to run a StateT monad. Running this on ghci we get:

```haskell
 *Main> runWalk 5 0.0 gen
[0.1600255836730147,0.1575360140445035,-1.595627933129274,
-0.18196791439834512,-1.082222285056746]
```

This is what we can accomplish: we can easily operate simultaneously with functions that expect a state monad, like put and get, we can unwrap things with `<-` from the inner `Rand` monad by using `lift` , and we can return things to the state monad. We could have any monad inside the `StateT` transformer. For example, we could have another `State` monad. Here is a fancy implementation of the Fibonacci sequence using a `State` monad (that stores the last but one value in the sequence as its internal state) inside a `StateT` transfomer (that stores the last value of the sequence):

```haskell
fancyFib :: StateT Int (State Int) Int
fancyFib = do old <- lift get
              new <- get
              let new' = new + old
                  old' = new
              lift $ put old'
              put new'
              return new

fancyFibs :: Int -> StateT Int (State Int) [Int]
fancyFibs n = replicateM n fancyFibs
```

And we can run this to get:

```haskell
*Main> evalState (evalStateT (fancyFibs 10) 1) 0
[1,1,2,3,5,8,13,21,34,55]
```
