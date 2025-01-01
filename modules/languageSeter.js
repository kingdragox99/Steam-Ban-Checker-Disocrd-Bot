const language = require("../lang/langs.js");

// Cache pour les langues
const langCache = new Map();

const languageSeter = (data) => {
  // Vérifier le cache d'abord
  if (langCache.has(data)) {
    return langCache.get(data);
  }

  const langMap = {
    fr_FR: language.fr_FR,
    en_EN: language.en_EN,
    es_ES: language.es_ES,
    command: language.command,
  };

  const result = langMap[data] || language.en_EN;
  langCache.set(data, result);
  return result;
};

module.exports = languageSeter;
