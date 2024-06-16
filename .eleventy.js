const { DateTime } = require("luxon");
const pluginSEO = require("eleventy-plugin-seo");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");


module.exports = function (eleventyConfig) {
  eleventyConfig.setTemplateFormats([
    "html",
    "njk",
    "md",
    //static assets
    "css",
    "jpg",
    "jpeg",
    "png",
    "svg",
    "ico",
    "woff",
    "woff2"
  ]);
  eleventyConfig.addPassthroughCopy("public");
  const seo = require("./src/seo.json");
  eleventyConfig.addPlugin(pluginSEO, seo);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addFilter("htmlDateString", dateObj => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  eleventyConfig.addFilter("postDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
  });

  eleventyConfig.setBrowserSyncConfig({ ghostMode: false });
  eleventyConfig.addCollection("posts", function (collection) {
    const coll = collection
      .getFilteredByGlob("**/posts/*.md")
      .sort((a, b) => {
        return b.date - a.date;
      });

    for (let i = 0; i < coll.length; i++) {
      const prevPost = coll[i - 1];
      const nextPost = coll[i + 1];
      coll[i].data["prevPost"] = prevPost;
      coll[i].data["nextPost"] = nextPost;
    }

    return coll;
  });

  eleventyConfig.addCollection("publications", function (collection) {
    const coll = collection
      .getFilteredByGlob("**/publications/*.md")
      .sort((a, b) => {
        return b.date - a.date;
      });
    return coll;
  });


  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "build"
    }
  };
};
