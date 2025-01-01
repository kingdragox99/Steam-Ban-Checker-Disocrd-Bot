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

// Fonction pour extraire la date de ban du texte
function extractBanDate(banText) {
  if (!banText) return null;

  const daysMatch = banText.match(/(\d+) day/);
  if (!daysMatch) return null;

  const daysAgo = parseInt(daysMatch[1]);
  const banDate = new Date();
  banDate.setDate(banDate.getDate() - daysAgo);
  return banDate.toISOString();
}

// Fonction pour détecter le type de ban
function detectBanType($) {
  const banTexts = [
    $(".profile_ban_status").text(),
    $(".profile_ban").text(),
    $("#profile_ban_status").text(),
    $(".profile_ban_text").text(),
  ]
    .map((text) => cleanHtml(text))
    .filter(Boolean);

  console.log("\x1b[43m\x1b[1mDEBUG\x1b[0m: Ban texts found:", banTexts);

  for (const text of banTexts) {
    // Détection des bans multiples
    if (text.includes("Multiple VAC bans")) return "Multiple VAC";
    if (text.includes("Multiple game bans")) return "Multiple Game";

    // Détection des bans simples
    if (text.includes("VAC ban") || text.includes("VAC banned")) return "VAC";
    if (text.includes("game ban") || text.includes("game ban on record"))
      return "Game";
    if (text.includes("Trade ban") || text.includes("trade banned"))
      return "Trade";
    if (text.includes("Community ban") || text.includes("community banned"))
      return "Community";
  }

  // Si on a trouvé un ban mais pas son type spécifique
  if (
    banTexts.some(
      (text) =>
        text.toLowerCase().includes("ban") ||
        text.toLowerCase().includes("banned")
    )
  ) {
    return "Unknown";
  }

  return null;
}

// Fonction principale pour scraper toutes les informations
async function scrapSteamProfile(url) {
  try {
    // Vérifier le cache
    if (profileCache.has(url)) {
      const cached = profileCache.get(url);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
      profileCache.delete(url);
    }

    console.log(`\x1b[43m\x1b[1mDEBUG\x1b[0m: Fetching profile ${url}`);
    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);

    // Récupérer toutes les informations en une fois
    const name = cleanHtml($(".actual_persona_name").text());
    console.log(`\x1b[43m\x1b[1mDEBUG\x1b[0m: Found name: ${name}`);

    // Récupérer le texte de ban en excluant le lien Info
    const banStatusElement = $(".profile_ban_status");
    const banElement = banStatusElement.find(".profile_ban");

    // Récupérer le texte du ban en excluant le contenu de profile_ban_info
    let banText = "";
    if (banElement.length > 0) {
      // Cloner l'élément pour ne pas modifier l'original
      const banElementClone = banElement.clone();
      // Supprimer le span profile_ban_info
      banElementClone.find(".profile_ban_info").remove();
      banText = cleanHtml(banElementClone.text());
    }

    // Récupérer le texte de la date de ban (qui est un nœud texte direct de profile_ban_status)
    const banDateText = cleanHtml(
      banStatusElement
        .contents()
        .filter((_, el) => el.nodeType === 3) // Nœuds texte uniquement
        .text()
    );

    console.log(`\x1b[43m\x1b[1mDEBUG\x1b[0m: Ban text:`, banText);
    console.log(`\x1b[43m\x1b[1mDEBUG\x1b[0m: Ban date text:`, banDateText);

    // Déterminer le statut et le type de ban
    const banStatus =
      banText.length > 0 &&
      (banText.toLowerCase().includes("ban") ||
        banText.toLowerCase().includes("vac"));
    let banType = null;

    if (banStatus) {
      const lowerBanText = banText.toLowerCase();

      // Détection des bans multiples d'abord
      if (lowerBanText.includes("multiple vac bans")) {
        banType = "Multiple VAC";
      } else if (lowerBanText.includes("multiple game bans")) {
        banType = "Multiple Game";
      }
      // Puis les bans simples
      else if (lowerBanText.match(/\d+\s*vac ban/)) {
        banType = "VAC";
      } else if (lowerBanText.match(/\d+\s*game ban/)) {
        banType = "Game";
      } else if (lowerBanText.includes("trade ban")) {
        banType = "Trade";
      } else if (lowerBanText.includes("community ban")) {
        banType = "Community";
      }
    }

    console.log(`\x1b[43m\x1b[1mDEBUG\x1b[0m: Ban status:`, banStatus);
    console.log(`\x1b[43m\x1b[1mDEBUG\x1b[0m: Detected ban type:`, banType);

    // Extraire la date de ban
    const banDate = extractBanDate(banDateText);
    console.log(`\x1b[43m\x1b[1mDEBUG\x1b[0m: Extracted ban date:`, banDate);

    // Préparer les données
    const profileData = {
      name,
      banStatus,
      banType: banStatus ? banType || "Unknown" : null,
      banDate,
      lastChecked: new Date().toISOString(),
    };

    // Mettre en cache
    profileCache.set(url, {
      data: profileData,
      timestamp: Date.now(),
    });

    console.log(
      `\x1b[42m\x1b[1mSUCCESS\x1b[0m: Retrieved profile data for ${name}:\n` +
        `Ban Status: ${banStatus}\n` +
        `Ban Type: ${profileData.banType || "None"}\n` +
        `Ban Date: ${banDate || "N/A"}`
    );

    return profileData;
  } catch (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to scrap Steam profile:",
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
  scrapSteamProfile, // Nouvelle fonction principale
  scrapName, // Pour la compatibilité
  scrapBan, // Pour la compatibilité
  scrapBanType, // Pour la compatibilité
};
