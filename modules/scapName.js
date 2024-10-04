const cheerio = require("cheerio");
const axios = require("axios");

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
