const cheerio = require("cheerio");
const axios = require("axios");

async function scapName(url) {
  try {
    let res = await axios.get(url);
    let $ = await cheerio.load(res.data);
    let status = $(".actual_persona_name").text();
    if (status) {
      return status;
    } else {
      return "Pute sans nom";
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = scapName;
