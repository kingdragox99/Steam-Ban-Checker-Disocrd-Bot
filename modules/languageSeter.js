const language = require("../lang/langs.js");

const languageSeter = (data) => {
  switch (data) {
    case "fr_FR":
      return language.fr_FR;
      break;
    case "en_EN":
      return language.en_EN;
      break;
    case "es_ES":
      return language.es_ES;
      break;
  }
};

module.exports = languageSeter;
