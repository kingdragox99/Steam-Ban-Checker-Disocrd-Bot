const cheerio = require("cheerio");
const axios = require("axios");

async function scapBan(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const status = $(".profile_ban").text().trim(); // Utilisation de trim pour nettoyer le texte

    return !!status; // Retourne true si le statut est non vide, false sinon
  } catch (err) {
    console.error("Error fetching data:", err.message);
    return null; // Retourner null en cas d'erreur
  }
}

module.exports = scapBan;
