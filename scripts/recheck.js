const { supabase } = require("../modules/supabBaseConnect");
const { scrapSteamProfile } = require("../modules/steamScraper");
const Bottleneck = require("bottleneck");

// Configuration du limiteur de requêtes ultra-optimisée
const limiter = new Bottleneck({
  maxConcurrent: 40, // 40 requêtes simultanées
  minTime: 25, // 1000ms/40 = 25ms entre chaque requête
  reservoir: 400, // Buffer plus large
  reservoirRefreshAmount: 400,
  reservoirRefreshInterval: 10 * 1000, // Rafraîchissement toutes les 10 secondes
});

// Statistiques
const stats = {
  total: 0,
  processed: 0,
  updated: 0,
  errors: 0,
  startTime: Date.now(),
  batchesProcessed: 0,
  lastUpdate: null,
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
  console.log("\x1b[45m\x1b[1m=== STEAM BANNED PROFILES RECHECK ===\x1b[0m");

  // Barre de progression
  console.log(`\x1b[36mProgress:\x1b[0m [${createProgressBar(progress)}]`);

  // Statistiques sur une seule ligne
  console.log(
    `\x1b[36mStats:\x1b[0m ${stats.processed}/${stats.total} profiles | ` +
      `\x1b[36mUpdated:\x1b[0m ${stats.updated} | ` +
      `\x1b[36mErrors:\x1b[0m ${stats.errors} | ` +
      `\x1b[36mBatches:\x1b[0m ${stats.batchesProcessed}`
  );

  // Performance sur une seule ligne
  console.log(
    `\x1b[36mSpeed:\x1b[0m ${profilesPerSecond.toFixed(2)}/s | ` +
      `\x1b[36mRuntime:\x1b[0m ${formatTime(runTime)} | ` +
      `\x1b[36mETA:\x1b[0m ${formatTime(eta)}`
  );

  // Dernière mise à jour
  if (stats.lastUpdate) {
    console.log(`\x1b[36mLast Update:\x1b[0m ${stats.lastUpdate}`);
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "∞";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

// Fonction optimisée pour vérifier un profil
async function recheckProfile(profile) {
  try {
    const data = await limiter.schedule(() => scrapSteamProfile(profile.url));
    if (!data) {
      stats.errors++;
      return;
    }

    const changes = {};
    if (data.name !== profile.steam_name) changes.steam_name = data.name;
    if (data.banStatus !== profile.ban) changes.ban = data.banStatus;
    if (data.banType !== profile.ban_type) changes.ban_type = data.banType;
    if (data.banDate !== profile.ban_date) changes.ban_date = data.banDate;
    changes.last_checked = new Date().toISOString();

    if (Object.keys(changes).length > 0) {
      const { error } = await supabase
        .from("profil")
        .update(changes)
        .eq("url", profile.url);

      if (error) {
        stats.errors++;
        return;
      }

      stats.updated++;
      stats.lastUpdate = `${profile.url} → ${
        changes.ban_type || profile.ban_type || "unknown"
      }`;
    }

    stats.processed++;
  } catch (error) {
    stats.errors++;
  }
}

// Fonction pour récupérer les profils bannis par lots
async function fetchBannedProfiles(from, to) {
  const { data, error } = await supabase
    .from("profil")
    .select("*")
    .eq("ban", true)
    .range(from, to);

  if (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to fetch profiles:",
      error
    );
    throw error;
  }

  return data;
}

// Fonction principale optimisée
async function main() {
  try {
    // Obtenir le nombre total de profils bannis
    const { count, error } = await supabase
      .from("profil")
      .select("*", { count: "exact", head: true })
      .eq("ban", true);

    if (error) throw error;

    stats.total = count;
    console.log(
      `\x1b[44m\x1b[1mINFO\x1b[0m: Found ${count} banned profiles to check`
    );

    const displayInterval = setInterval(updateDisplay, 1000);
    const batchSize = 1000; // Taille maximale pour Supabase
    const processingBatchSize = 40; // 40 profils traités simultanément

    // Traiter les profils par grands lots
    for (let start = 0; start < count; start += batchSize) {
      const end = Math.min(start + batchSize - 1, count - 1);
      const profiles = await fetchBannedProfiles(start, end);
      stats.batchesProcessed++;

      // Traiter les profils par petits lots pour le scraping
      for (let i = 0; i < profiles.length; i += processingBatchSize) {
        const batch = profiles.slice(i, i + processingBatchSize);
        await Promise.all(batch.map((profile) => recheckProfile(profile)));
      }
    }

    clearInterval(displayInterval);
    updateDisplay();
    console.log("\x1b[42m\x1b[1mSUCCESS\x1b[0m: Recheck completed!");
  } catch (error) {
    console.error("\x1b[41m\x1b[1mERROR\x1b[0m: Script failed:", error);
  }
}

// Lancer le script
console.log("\x1b[45m\x1b[1m=== STEAM BANNED PROFILES RECHECK ===\x1b[0m");
main();
