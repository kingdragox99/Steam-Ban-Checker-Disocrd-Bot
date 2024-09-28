const cheerio = require("cheerio");
const axios = require("axios");

/**
 * Récupère le nom d'une personne à partir de l'URL fournie
 * @param {string} url - L'URL à scrapper
 * @returns {Promise<string>} - Retourne le nom récupéré ou un nom par défaut en cas d'absence
 */
async function scapName(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const name = $(".actual_persona_name").text();

    return name || "Pute sans nom"; // Retourne le nom ou un nom par défaut
  } catch (err) {
    console.error("Error fetching data:", err.message);
    return "Erreur lors de la récupération du nom"; // Retourner un message par défaut en cas d'erreur
  }
}

module.exports = scapName;
