const language = require("../lang/langs.js");

const languageSeter = (data) => {
  if (data == "fr_FR") {
    return language.fr_FR;
  }
  if (data == "en_EN") {
    return language.en_EN;
  }
};

module.exports = languageSeter;
