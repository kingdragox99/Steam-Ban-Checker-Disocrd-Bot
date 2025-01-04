const axios = require("axios");
const cheerio = require("cheerio");
const { scrapSteamProfile } = require("./modules/steamScraper");
const { supabase } = require("./modules/supabBaseConnect");
const Bottleneck = require("bottleneck");
require("dotenv").config();

// Gestion des arguments de ligne de commande
const DEBUG_MODE = process.argv.includes("--debug");

// Fonction de log conditionnelle
function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log("\x1b[43m\x1b[1mDEBUG\x1b[0m:", ...args);
  }
}

// Fonction pour convertir les URLs Steam en format Steam64
async function convertToSteam64Url(url) {
  try {
    if (url.includes("/profiles/")) {
      // Déjà au format Steam64
      return url;
    }

    // Pour les URLs au format /id/
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Rechercher le data-steamid dans la page
    const steamId = $("[data-steamid]").attr("data-steamid");
    if (steamId) {
      return `https://steamcommunity.com/profiles/${steamId}`;
    }

    return url; // Retourner l'URL originale si la conversion échoue
  } catch (error) {
    console.error(
      `\x1b[41m\x1b[1mERROR\x1b[0m: Failed to convert URL ${url}:`,
      error.message
    );
    return url;
  }
}

// Cache pour les profils déjà traités
const processedProfiles = new Set();
// Cache pour les erreurs 403
const rateLimitCache = new Map();

// Statistiques
const stats = {
  totalProfiles: 0,
  processedProfiles: 0,
  bannedProfiles: 0,
  queueSize: 0,
  startTime: Date.now(),
  lastUpdateTime: Date.now(),
  rateLimit403: 0,
  errors: 0,
  currentBatch: 0,
  debugMode: DEBUG_MODE,
  dailyProcessed: 0,
  lastDayReset: Date.now(),
};

// Configuration optimisée de Bottleneck
const limiter = new Bottleneck({
  maxConcurrent: 4,
  minTime: 1000,
  reservoir: 50,
  reservoirRefreshAmount: 50,
  reservoirRefreshInterval: 60 * 1000,
});

// Constantes
const DAILY_LIMIT = 40000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Fonction pour vérifier et réinitialiser le compteur quotidien
function checkDailyLimit() {
  const now = Date.now();

  // Réinitialiser le compteur si on est le lendemain
  if (now - stats.lastDayReset >= DAY_IN_MS) {
    stats.dailyProcessed = 0;
    stats.lastDayReset = now;
    debugLog("Daily counter reset");
  }

  // Vérifier si on a atteint la limite
  if (stats.dailyProcessed >= DAILY_LIMIT) {
    debugLog("Daily limit reached, waiting for reset");
    return false;
  }

  return true;
}

// Fonction pour mettre à jour l'interface console
function updateConsole() {
  const now = Date.now();
  const runTime = Math.floor((now - stats.startTime) / 1000);
  const profilesPerSecond = stats.processedProfiles / runTime;
  const remainingProfiles = stats.totalProfiles - stats.processedProfiles;
  const estimatedTimeRemaining = Math.floor(
    remainingProfiles / profilesPerSecond
  );
  const timeToReset = DAY_IN_MS - (now - stats.lastDayReset);
  const remainingDaily = DAILY_LIMIT - stats.dailyProcessed;

  // Effacer la console
  console.clear();

  // Afficher le header
  console.log(
    "\x1b[45m\x1b[1m=== STEAM BAN TRACKER - CRAWLER STATUS ===\x1b[0m"
  );

  // Afficher les statistiques sur une seule ligne
  console.log(
    `\x1b[36mQueue:\x1b[0m ${stats.queueSize} | ` +
      `\x1b[36mProcessed:\x1b[0m ${stats.processedProfiles}/${stats.totalProfiles} | ` +
      `\x1b[36mBanned:\x1b[0m ${stats.bannedProfiles} | ` +
      `\x1b[36mBatch:\x1b[0m ${stats.currentBatch}`
  );

  // Afficher les limites quotidiennes sur une ligne
  console.log(
    `\x1b[36mDaily:\x1b[0m ${stats.dailyProcessed}/${DAILY_LIMIT} | ` +
      `\x1b[36mRemaining:\x1b[0m ${remainingDaily} | ` +
      `\x1b[36mReset in:\x1b[0m ${formatTime(Math.floor(timeToReset / 1000))}`
  );

  // Afficher les performances sur une ligne
  console.log(
    `\x1b[36mSpeed:\x1b[0m ${profilesPerSecond.toFixed(2)}/s | ` +
      `\x1b[36mRuntime:\x1b[0m ${formatTime(runTime)} | ` +
      `\x1b[36mETA:\x1b[0m ${formatTime(estimatedTimeRemaining)}`
  );

  // Afficher les erreurs sur une ligne
  console.log(
    `\x1b[36m403s:\x1b[0m ${stats.rateLimit403} | ` +
      `\x1b[36mErrors:\x1b[0m ${stats.errors} | ` +
      `\x1b[36mDebug:\x1b[0m ${DEBUG_MODE ? "ON" : "OFF"}`
  );

  stats.lastUpdateTime = now;
}

// Fonction pour formater le temps en heures:minutes:secondes
function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "∞";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

// Mettre à jour la console toutes les secondes
setInterval(updateConsole, 1000);

// Fonction de retry optimisée
const retryWithBackoff = async (fn, retries = 2, baseDelay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 403) {
        stats.rateLimit403++;
        const delay = baseDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Maximum retry attempts reached");
};

// Fonction optimisée pour les requêtes HTTP
async function makeRequest(url, options = {}) {
  const lastError = rateLimitCache.get(url);
  if (lastError && Date.now() - lastError < 180000) {
    return null;
  }

  try {
    const response = await retryWithBackoff(() =>
      limiter.schedule(() =>
        axios.get(url, {
          ...options,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            ...options.headers,
          },
          timeout: options.timeout || 5000,
        })
      )
    );
    return response;
  } catch (error) {
    if (error.response?.status === 403) {
      rateLimitCache.set(url, Date.now());
    }
    stats.errors++;
    throw error;
  }
}

// Fonction optimisée pour récupérer les amis
async function fetchSteamFriends(profileUrl) {
  try {
    const steam64Url = await convertToSteam64Url(profileUrl);
    const friendsUrl = `${steam64Url}friends/`;
    debugLog(`Fetching friends from ${friendsUrl}`);
    const response = await makeRequest(friendsUrl);
    if (!response) return [];

    const $ = cheerio.load(response.data);
    const contacts = new Set();

    $(".selectable_overlay").each((_, element) => {
      const contactUrl = $(element).attr("href");
      if (contactUrl && !processedProfiles.has(contactUrl)) {
        contacts.add(contactUrl);
        stats.totalProfiles++;
        debugLog(`Found new contact: ${contactUrl}`);
      }
    });

    return Array.from(contacts);
  } catch (error) {
    stats.errors++;
    debugLog(`Error fetching friends:`, error.message);
    return [];
  }
}

// Fonction pour obtenir le premier profil avec le statut 'pending'
async function getFirstPendingProfile() {
  try {
    const { data: pendingProfile, error } = await supabase
      .from("profil")
      .select("*")
      .eq("status", "pending")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to get pending profile:",
        error
      );
      return null;
    }

    if (!pendingProfile) {
      console.log("\x1b[43m\x1b[1mINFO\x1b[0m: No pending profiles found.");
      return null;
    }

    return pendingProfile.url;
  } catch (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to get pending profile:",
      error
    );
    return null;
  }
}

// Fonction pour marquer un profil comme "in progress"
async function markProfileAsInProgress(profileUrl) {
  try {
    const { error } = await supabase
      .from("profil")
      .update({ status: "in_progress" })
      .eq("url", profileUrl);

    if (error) {
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to mark profile as in progress:",
        error
      );
    }
  } catch (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to mark profile as in progress:",
      error
    );
  }
}

// Fonction pour marquer un profil comme terminé
async function markProfileAsDone(profileUrl) {
  try {
    const { error } = await supabase
      .from("profil")
      .update({ status: "done" })
      .eq("url", profileUrl);

    if (error) {
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to mark profile as done:",
        error
      );
      return;
    }

    console.log(
      "\x1b[45m\x1b[1mCOMPLETE\x1b[0m: Profile marked as completed:",
      profileUrl
    );
  } catch (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to mark profile as done:",
      error
    );
  }
}

// Optimisation de l'ajout de contact
async function addContact(contactUrl) {
  // Vérifier la limite quotidienne
  if (!checkDailyLimit()) {
    debugLog(`Daily limit reached, skipping ${contactUrl}`);
    return;
  }

  if (processedProfiles.has(contactUrl)) return;
  processedProfiles.add(contactUrl);

  try {
    const steam64Url = await convertToSteam64Url(contactUrl);
    debugLog(`Processing contact: ${steam64Url}`);

    // Vérifier si le profil existe déjà
    const { data: existingProfile, error: checkError } = await supabase
      .from("profil")
      .select("*")
      .eq("url", steam64Url)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to check profile:",
        checkError
      );
      return;
    }

    if (existingProfile) {
      stats.processedProfiles++;
      debugLog(`Profile already exists: ${steam64Url}`);
      return;
    }

    // Récupérer les informations du profil
    const profileData = await scrapSteamProfile(steam64Url);
    if (!profileData) {
      debugLog(`Failed to get profile data for: ${steam64Url}`);
      return;
    }

    debugLog(`Adding to database: ${steam64Url}`, profileData);

    // Insérer le nouveau profil
    const { error: insertError } = await supabase.from("profil").insert([
      {
        url: steam64Url,
        steam_name: profileData.name,
        ban: profileData.banStatus,
        ban_type: profileData.banType,
        ban_date: profileData.banDate,
        last_checked: new Date().toISOString(),
        status: "pending",
      },
    ]);

    if (insertError) {
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to insert profile:",
        insertError
      );
      stats.errors++;
      return;
    }

    stats.processedProfiles++;
    stats.dailyProcessed++;
    if (profileData.banStatus) {
      stats.bannedProfiles++;
      console.log(
        `\x1b[42m\x1b[1mBANNED\x1b[0m: Found banned profile ${steam64Url}\n` +
          `Name: ${profileData.name}\n` +
          `Ban Type: ${profileData.banType || "unknown"}\n` +
          `Ban Date: ${profileData.banDate || "N/A"}`
      );
    } else {
      debugLog(`Successfully added profile: ${steam64Url}`);
    }
  } catch (error) {
    stats.errors++;
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to process contact:",
      error
    );
  }
}

// Optimisation du traitement des profils
async function crawlProfile(profileUrl) {
  try {
    debugLog(`Starting to crawl profile: ${profileUrl}`);
    await markProfileAsInProgress(profileUrl);
    const contacts = await fetchSteamFriends(profileUrl);
    stats.queueSize = contacts.length;
    debugLog(`Found ${contacts.length} contacts to process`);

    // Traitement par lots de 5 contacts
    const batchSize = 5;
    for (let i = 0; i < contacts.length; i += batchSize) {
      stats.currentBatch = Math.floor(i / batchSize) + 1;
      const batch = contacts.slice(i, i + batchSize);
      debugLog(
        `Processing batch ${stats.currentBatch} (${batch.length} contacts)`
      );
      await Promise.all(batch.map((contactUrl) => addContact(contactUrl)));
    }

    await markProfileAsDone(profileUrl);
    debugLog(`Profile completed: ${profileUrl}`);
    await crawlFirstPendingProfile();
  } catch (error) {
    stats.errors++;
    debugLog(`Error crawling profile:`, error.message);
  }
}

// Fonction principale pour démarrer le crawler
async function crawlFirstPendingProfile(startUrl = null) {
  const profileUrl = startUrl || (await getFirstPendingProfile());

  if (!profileUrl) {
    console.log(`\x1b[42m\x1b[1mSUCCESS\x1b[0m: Crawling completed!`);
    return;
  }

  await crawlProfile(profileUrl);
}

// Lancer le crawler
console.log("\x1b[45m\x1b[1m=== STEAM BAN TRACKER - CRAWLER STATUS ===\x1b[0m");
console.log(`Debug mode: ${DEBUG_MODE ? "ON" : "OFF"}`);
crawlFirstPendingProfile();
