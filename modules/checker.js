const rp = require("request-promise");
const cheerio = require("cheerio");

const checker = (url) => {
  rp(url)
    .then(function (html) {
      const $ = cheerio.load(html);
      const status = $(".profile_ban").text();
      if (!status) {
        console.log("not ban");
      } else {
        console.log("ban");
      }
    })
    .catch(function (err) {
      console.log(err);
    });
};

module.exports = checker;
