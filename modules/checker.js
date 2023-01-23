const cheerio = require("cheerio");
const axios = require("axios");

async function checker(url) {
  try {
    let res = await axios.get(url);
    let $ = await cheerio.load(res.data);
    let status = $(".profile_ban").text();
    if (status) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
  }
}

// const checker = (url) => {
//   rp(url)
//     .then(function (html) {
//       const $ = cheerio.load(html);
//       const status = $(".profile_ban").text();
//       if (!status) {
//         return (ban = false);
//       } else {
//         return (ban = true);
//       }
//     })
//     .catch(function (err) {
//       console.log(err);
//     });
// };

module.exports = checker;
