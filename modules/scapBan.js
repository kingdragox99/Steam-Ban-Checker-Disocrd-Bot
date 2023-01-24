const cheerio = require("cheerio");
const axios = require("axios");

async function scapBan(url) {
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

module.exports = scapBan;
