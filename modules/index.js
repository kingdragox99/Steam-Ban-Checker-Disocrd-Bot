// Importation des modules
const setupCheckerInput = require("./setupCheckerInput");
const { scrapBan, scrapName, scrapBanType } = require("./steamScraper");
const textChecker = require("./textChecker");
const languageChecker = require("./languageChecker");
const languageSeter = require("./languageSeter");
const scheduleStart = require("./schedule").scheduleStart;

// Export des modules
module.exports = {
  setupCheckerInput,
  scrapBan,
  scrapName,
  scrapBanType,
  textChecker,
  languageChecker,
  languageSeter,
  scheduleStart,
};
