const language = require("../lang/langs.js");

const languageSeter = (data) => {
  const langMap = {
    fr_FR: language.fr_FR,
    en_EN: language.en_EN,
    es_ES: language.es_ES,
    command: language.command,
  };

  return langMap[data] || en_EN; // Retourne la langue correspondante ou null si non trouvé
};

module.exports = languageSeter;
