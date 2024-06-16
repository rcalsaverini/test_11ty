/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,njk}"],
  theme: {},
  daisyui: {
    themes: ["light", "dark"],
  },
  plugins: [require("daisyui")],
}

