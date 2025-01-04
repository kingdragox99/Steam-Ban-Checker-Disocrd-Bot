const axios = require("axios");
const cheerio = require("cheerio");

// Configuration d'Axios avec compression gzip et timeout
const axiosInstance = axios.create({
  headers: {
    "Accept-Encoding": "gzip, deflate",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  },
  timeout: 5000,
});

// Cache pour les profils déjà scrapés
const profileCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Fonction utilitaire pour nettoyer le HTML
function cleanHtml(text) {
  return text.replace(/\s+/g, " ").trim();
}

// Fonction pour extraire la date de ban
function extractBanDate(banText) {
  if (!banText) return null;

  // Format "X day(s) since last ban"
  const daysMatch = banText
    .trim()
    .match(/^(\d+)\s*day\(s\)\s*since\s*last\s*ban$/i);
  if (daysMatch) {
    const daysAgo = parseInt(daysMatch[1]);
    const banDateTime = new Date();
    banDateTime.setDate(banDateTime.getDate() - daysAgo);
    return banDateTime.toISOString().split("T")[0]; // Retourne seulement la date YYYY-MM-DD
  }

  return null;
}

// Fonction principale pour scraper toutes les informations
async function scrapSteamProfile(url) {
  try {
    // Vérifier le cache
    const cached = profileCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);

    // Récupérer le nom du profil
    const name =
      $(".actual_persona_name").text().trim() ||
      $(".profile_header_name").text().trim();

    // Vérifier explicitement la présence d'un ban
    const banStatusElement = $(".profile_ban");
    const banText = cleanHtml(banStatusElement.text().toLowerCase());

    // Récupérer le texte de date de ban séparément
    const banDateText = cleanHtml(
      $(".profile_ban_status").contents().last().text()
    );

    // Détection plus précise des bans
    let banStatus = false;
    let banType = null;

    // Vérifier les différents types de bans
    if (
      banText.includes("1 VAC ban") ||
      banText.includes("multiple vac bans")
    ) {
      banStatus = true;
      banType = "vac ban";
    } else if (
      banText.includes("1 game ban") ||
      banText.includes("multiple game bans")
    ) {
      banStatus = true;
      banType = "game ban";
    } else if (banText.includes("trade banned")) {
      banStatus = true;
      banType = "trade ban";
    }

    // Extraire la date de ban si un ban est détecté
    let banDate = null;
    if (banStatus) {
      banDate = extractBanDate(banDateText);
    }

    // Préparer les données
    const profileData = {
      name,
      banStatus,
      banType,
      banDate,
      lastChecked: new Date().toISOString().split("T")[0],
    };

    // Mettre en cache
    profileCache.set(url, {
      data: profileData,
      timestamp: Date.now(),
    });

    return profileData;
  } catch (error) {
    console.error(
      `\x1b[41m\x1b[1mERROR\x1b[0m: Failed to scrape profile ${url}:`,
      error.message
    );
    return null;
  }
}

// Pour la compatibilité avec l'ancien code
async function scrapName(url) {
  const data = await scrapSteamProfile(url);
  return data ? data.name : null;
}

async function scrapBan(url) {
  const data = await scrapSteamProfile(url);
  return data ? data.banStatus : null;
}

async function scrapBanType(url) {
  const data = await scrapSteamProfile(url);
  return data ? data.banType : null;
}

// Nettoyage périodique du cache
setInterval(() => {
  const now = Date.now();
  for (const [url, data] of profileCache.entries()) {
    if (now - data.timestamp > CACHE_TTL) {
      profileCache.delete(url);
    }
  }
}, CACHE_TTL);

module.exports = {
  scrapSteamProfile,
  scrapName,
  scrapBan,
  scrapBanType,
};
