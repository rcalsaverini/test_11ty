const { DateTime } = require("luxon");
const pluginSEO = require("eleventy-plugin-seo");

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
    eleventyConfig.addFilter("htmlDateString", dateObj => {
        return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
    });    
    eleventyConfig.setBrowserSyncConfig({ ghostMode: false });
    eleventyConfig.addCollection("posts", function(collection) {
        const coll = collection
            .getFilteredByTag("posts");
        
        for (let i = 0; i < coll.length; i++) {
            const prevPost = coll[i - 1];
            const nextPost = coll[i + 1];
            coll[i].data["prevPost"] = prevPost;
            coll[i].data["nextPost"] = nextPost;
        }

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
