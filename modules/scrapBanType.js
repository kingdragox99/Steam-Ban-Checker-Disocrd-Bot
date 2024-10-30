const cheerio = require("cheerio");
const axios = require("axios");

async function getSteamBanType(steamUrl) {
  try {
    const response = await axios.get(steamUrl);
    const html = response.data;
    const $ = cheerio.load(html);
    const banType = $(".profile_ban").text().trim().toLowerCase();

    if (banType.includes("game ban")) {
      return "game ban";
    } else if (banType.includes("vac ban")) {
      return "vac ban";
    } else if (banType.includes("trade ban")) {
      return "trade ban";
    } else {
      return "Unban";
    }
  } catch (error) {
    console.error("Error while fetching Steam profile information:", error);
    return "Error while fetching information";
  }
}

module.exports = getSteamBanType;
