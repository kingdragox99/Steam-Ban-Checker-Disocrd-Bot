const { supabase } = require("../modules/supabBaseConnect");
const axios = require("axios");
const cheerio = require("cheerio");
const Bottleneck = require("bottleneck");

// Configuration du limiteur de requêtes
const limiter = new Bottleneck({
  maxConcurrent: 100,
  minTime: 50,
  reservoir: 2000,
  reservoirRefreshAmount: 2000,
  reservoirRefreshInterval: 10 * 1000,
});

// Statistiques
const stats = {
  total: 0,
  processed: 0,
  converted: 0,
  errors: 0,
  startTime: Date.now(),
};

// Fonction pour créer une barre de progression
function createProgressBar(progress, size = 40) {
  const filled = Math.round(progress * size);
  const empty = size - filled;
  const filledBar = "█".repeat(filled);
  const emptyBar = "░".repeat(empty);
  const percentage = Math.round(progress * 100);
  return `${filledBar}${emptyBar} ${percentage}%`;
}

// Fonction pour mettre à jour l'affichage
function updateDisplay() {
  const runTime = Math.floor((Date.now() - stats.startTime) / 1000);
  const profilesPerSecond = stats.processed / runTime;
  const remaining = stats.total - stats.processed;
  const eta = Math.floor(remaining / profilesPerSecond);
  const progress = stats.total > 0 ? stats.processed / stats.total : 0;

  console.clear();
  console.log("\x1b[45m\x1b[1m=== STEAM URL CONVERSION ===\x1b[0m");

  // Barre de progression
  console.log(`\x1b[36mProgress:\x1b[0m [${createProgressBar(progress)}]`);

  // Statistiques
  console.log(
    `\x1b[36mStats:\x1b[0m ${stats.processed}/${stats.total} profiles | ` +
      `\x1b[36mConverted:\x1b[0m ${stats.converted} | ` +
      `\x1b[36mErrors:\x1b[0m ${stats.errors}`
  );

  // Performance
  console.log(
    `\x1b[36mSpeed:\x1b[0m ${profilesPerSecond.toFixed(2)}/s | ` +
      `\x1b[36mRuntime:\x1b[0m ${formatTime(runTime)} | ` +
      `\x1b[36mETA:\x1b[0m ${formatTime(eta)}`
  );
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "∞";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

// Fonction pour convertir une URL en Steam64
async function convertToSteam64Url(url) {
  try {
    if (url.includes("/profiles/")) {
      return url; // Déjà au format Steam64
    }

    const response = await limiter.schedule(() =>
      axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        timeout: 5000,
      })
    );

    const $ = cheerio.load(response.data);

    // Méthode 1: Chercher dans l'attribut data-steamid
    let steamId = $("[data-steamid]").attr("data-steamid");

    // Méthode 2: Chercher dans les scripts de la page
    if (!steamId) {
      const scripts = $("script")
        .map((_, el) => $(el).html())
        .get();
      for (const script of scripts) {
        const match = script.match(/"steamid":"(\d+)"/);
        if (match) {
          steamId = match[1];
          break;
        }
      }
    }

    // Méthode 3: Chercher dans les liens de la page
    if (!steamId) {
      const profileLinks = $('a[href*="/profiles/"]')
        .map((_, el) => $(el).attr("href"))
        .get();
      for (const link of profileLinks) {
        const match = link.match(/\/profiles\/(\d+)/);
        if (match) {
          steamId = match[1];
          break;
        }
      }
    }

    // Méthode 4: Chercher dans le code source complet
    if (!steamId) {
      const pageSource = response.data;
      const match = pageSource.match(/g_steamID = "(\d+)"/);
      if (match) {
        steamId = match[1];
      }
    }

    if (steamId) {
      return `https://steamcommunity.com/profiles/${steamId}`;
    }

    // Si aucune méthode n'a fonctionné, essayer l'API Steam
    if (process.env.STEAM_API) {
      const vanityUrl = url.split("/id/")[1]?.replace(/\/$/, "");
      if (vanityUrl) {
        const apiUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API}&vanityurl=${vanityUrl}`;
        const apiResponse = await axios.get(apiUrl);
        if (apiResponse.data.response.success === 1) {
          return `https://steamcommunity.com/profiles/${apiResponse.data.response.steamid}`;
        }
      }
    }

    throw new Error("Steam64 ID not found");
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Profile not found");
    }
    throw error;
  }
}

// Fonction pour traiter un profil
async function processProfile(profile) {
  try {
    if (!profile.url.includes("/profiles/")) {
      const steam64Url = await convertToSteam64Url(profile.url);

      // Vérifier si l'URL a changé
      if (steam64Url !== profile.url) {
        const { error } = await supabase
          .from("profil")
          .update({ url: steam64Url })
          .eq("id", profile.id);

        if (error) throw error;

        stats.converted++;
        console.log(
          `\x1b[42m\x1b[1mCONVERTED\x1b[0m: ${profile.url} -> ${steam64Url}`
        );
      }
    }

    stats.processed++;
  } catch (error) {
    stats.errors++;
    console.error(
      `\x1b[41m\x1b[1mERROR\x1b[0m: Failed to process ${profile.url}:`,
      error.message
    );
  }
}

// Fonction principale
async function main() {
  try {
    console.log("\x1b[44m\x1b[1mINFO\x1b[0m: Fetching profiles...");

    // Obtenir le nombre total de profils
    const { count, error: countError } = await supabase
      .from("profil")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;
    stats.total = count;

    console.log(`\x1b[44m\x1b[1mINFO\x1b[0m: Found ${count} profiles to check`);

    // Mettre à jour l'affichage toutes les secondes
    const displayInterval = setInterval(updateDisplay, 1000);

    let lastId = 0;
    const batchSize = 1000;
    const processingBatchSize = 50;

    while (true) {
      // Récupérer un lot de profils
      const { data: profiles, error } = await supabase
        .from("profil")
        .select("*")
        .gt("id", lastId)
        .order("id", { ascending: true })
        .limit(batchSize);

      if (error) throw error;
      if (!profiles || profiles.length === 0) break;

      lastId = profiles[profiles.length - 1].id;

      // Traiter les profils par lots plus petits
      for (let i = 0; i < profiles.length; i += processingBatchSize) {
        const batch = profiles.slice(i, i + processingBatchSize);
        await Promise.all(batch.map((profile) => processProfile(profile)));
      }
    }

    clearInterval(displayInterval);
    updateDisplay();
    console.log("\x1b[42m\x1b[1mSUCCESS\x1b[0m: URL conversion completed!");
  } catch (error) {
    console.error("\x1b[41m\x1b[1mERROR\x1b[0m: Script failed:", error);
  }
}

// Lancer le script
console.log("\x1b[45m\x1b[1m=== STEAM URL CONVERSION ===\x1b[0m");
main();
