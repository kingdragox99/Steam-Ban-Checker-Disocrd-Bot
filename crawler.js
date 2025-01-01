const axios = require("axios");
const cheerio = require("cheerio");
const { scrapSteamProfile } = require("./modules/steamScraper");
const supabase = require("./modules/supabBaseConnect");
const Bottleneck = require("bottleneck");
require("dotenv").config();

// Cache pour les profils déjà traités
const processedProfiles = new Set();
// Cache pour les erreurs 403
const rateLimitCache = new Map();

// Configuration optimisée de Bottleneck
const limiter = new Bottleneck({
  maxConcurrent: 4,
  minTime: 1000,
  reservoir: 50,
  reservoirRefreshAmount: 50,
  reservoirRefreshInterval: 60 * 1000,
});

// Fonction de retry optimisée
const retryWithBackoff = async (fn, retries = 2, baseDelay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 403) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(
          `\x1b[43m\x1b[1mRETRY\x1b[0m: Waiting ${
            delay / 1000
          }s before next attempt...`
        );
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
    console.log(`\x1b[43m\x1b[1mSKIP\x1b[0m: URL in cooldown: ${url}`);
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
    throw error;
  }
}

// Fonction optimisée pour récupérer les amis
async function fetchSteamFriends(profileUrl) {
  try {
    const friendsUrl = `${profileUrl}friends/`;
    const response = await makeRequest(friendsUrl);
    if (!response) return [];

    const $ = cheerio.load(response.data);
    const contacts = new Set();

    $(".selectable_overlay").each((_, element) => {
      const contactUrl = $(element).attr("href");
      if (contactUrl && !processedProfiles.has(contactUrl)) {
        contacts.add(contactUrl);
      }
    });

    return Array.from(contacts);
  } catch (error) {
    console.error(
      `\x1b[41m\x1b[1mERROR\x1b[0m: Failed to fetch friends:`,
      error.message
    );
    return [];
  }
}

// Fonction pour obtenir le premier profil avec le statut 'pending'
async function getFirstPendingProfile() {
  try {
    const { data: pendingProfile } = await supabase.select("profil", "*", {
      where: { status: "pending" },
      limit: 1,
    });

    if (!pendingProfile || pendingProfile.length === 0) {
      console.log(`\x1b[43m\x1b[1mINFO\x1b[0m: No pending profiles found.`);
      return null;
    }

    return pendingProfile[0].url;
  } catch (error) {
    console.error(
      `\x1b[41m\x1b[1mERROR\x1b[0m: Failed to get pending profile:`,
      error
    );
    return null;
  }
}

// Fonction pour marquer un profil comme "in progress"
async function markProfileAsInProgress(profileUrl) {
  try {
    await supabase.update(
      "profil",
      { status: "in_progress" },
      { url: profileUrl }
    );
  } catch (error) {
    console.error(
      `\x1b[41m\x1b[1mERROR\x1b[0m: Failed to mark profile as in progress:`,
      error
    );
  }
}

// Fonction pour marquer un profil comme terminé
async function markProfileAsDone(profileUrl) {
  try {
    await supabase.update("profil", { status: "done" }, { url: profileUrl });
    console.log(
      `\x1b[45m\x1b[1mCOMPLETE\x1b[0m: ${profileUrl} marked as completed`
    );
  } catch (error) {
    console.error(
      `\x1b[41m\x1b[1mERROR\x1b[0m: Failed to mark profile as done:`,
      error
    );
  }
}

// Optimisation de l'ajout de contact
async function addContact(contactUrl) {
  if (processedProfiles.has(contactUrl)) return;
  processedProfiles.add(contactUrl);

  try {
    // Vérifier si le profil existe déjà
    const { data: existingProfile } = await supabase.select("profil", "*", {
      where: { url: contactUrl },
    });

    if (existingProfile && existingProfile.length > 0) {
      return;
    }

    // Récupérer les informations du profil
    const profileData = await scrapSteamProfile(contactUrl);
    if (!profileData) return;

    // Insérer le nouveau profil
    await supabase.insert("profil", {
      url: contactUrl,
      steam_name: profileData.name,
      ban: profileData.banStatus,
      ban_type: profileData.banType,
      ban_date: profileData.banDate,
      last_checked: profileData.lastChecked,
      status: "pending",
    });

    console.log(
      `\x1b[42m\x1b[1mSUCCESS\x1b[0m: Added profile ${contactUrl}\n` +
        `Name: ${profileData.name}\n` +
        `Ban Status: ${profileData.banStatus}\n` +
        `Ban Type: ${profileData.banType || "None"}\n` +
        `Ban Date: ${profileData.banDate || "N/A"}`
    );
  } catch (error) {
    console.error(`\x1b[41m\x1b[1mERROR\x1b[0m: Failed to add contact:`, error);
  }
}

// Optimisation du traitement des profils
async function crawlProfile(profileUrl) {
  try {
    await markProfileAsInProgress(profileUrl);
    const contacts = await fetchSteamFriends(profileUrl);

    // Traitement par lots de 5 contacts
    const batchSize = 5;
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      await Promise.all(batch.map((contactUrl) => addContact(contactUrl)));
    }

    await markProfileAsDone(profileUrl);
    await crawlFirstPendingProfile();
  } catch (error) {
    console.error(
      `\x1b[41m\x1b[1mERROR\x1b[0m: Failed to crawl profile:`,
      error
    );
  }
}

// Fonction principale pour démarrer le crawler
async function crawlFirstPendingProfile(startUrl = null) {
  const profileUrl = startUrl || (await getFirstPendingProfile());

  if (!profileUrl) {
    console.log(`\x1b[43m\x1b[1mINFO\x1b[0m: No profiles to crawl`);
    return;
  }

  console.log(`\x1b[42m\x1b[1mSTART\x1b[0m: Starting to crawl ${profileUrl}`);
  await crawlProfile(profileUrl);
}

// Lancer le crawler
crawlFirstPendingProfile();
