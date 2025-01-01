const { supabase } = require("../modules/supabBaseConnect");
const { scrapSteamProfile } = require("../modules/steamScraper");
const Bottleneck = require("bottleneck");

// Configuration du limiteur de requêtes
const limiter = new Bottleneck({
  maxConcurrent: 100,
  minTime: 10,
  reservoir: 1000,
  reservoirRefreshAmount: 1000,
  reservoirRefreshInterval: 10 * 1000,
});

// Statistiques
const stats = {
  total: 0,
  processed: 0,
  newBans: 0,
  errors: 0,
  startTime: Date.now(),
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
  console.log("\x1b[45m\x1b[1m=== STEAM BAN CHECK ===\x1b[0m");

  // Barre de progression
  console.log(`\x1b[36mProgress:\x1b[0m [${createProgressBar(progress)}]`);

  // Statistiques sur une seule ligne
  console.log(
    `\x1b[36mStats:\x1b[0m ${stats.processed}/${stats.total} profiles | ` +
      `\x1b[36mNew Bans:\x1b[0m ${stats.newBans} | ` +
      `\x1b[36mErrors:\x1b[0m ${stats.errors}`
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

// Fonction pour vérifier un profil
async function checkProfile(profile) {
  try {
    const data = await limiter.schedule(() => scrapSteamProfile(profile.url));
    if (!data) {
      stats.errors++;
      return;
    }

    // Si le statut de ban a changé
    if (data.banStatus !== profile.ban || data.banType !== profile.ban_type) {
      const changes = {
        ban: data.banStatus,
        ban_type: data.banType,
        ban_date: data.banDate,
        steam_name: data.name,
        last_checked: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profil")
        .update(changes)
        .eq("url", profile.url);

      if (error) {
        stats.errors++;
        return;
      }

      if (data.banStatus && !profile.ban) {
        stats.newBans++;
        stats.lastUpdate = `${profile.url} → ${data.banType || "unknown"}`;
      }
    }

    stats.processed++;
  } catch (error) {
    stats.errors++;
  }
}

// Fonction pour récupérer tous les profils non bannis
async function fetchAllUnbannedProfiles() {
  let allProfiles = [];
  let lastId = 0;
  const batchSize = 1000;

  while (true) {
    const { data: profiles, error } = await supabase
      .from("profil")
      .select("*")
      .eq("ban", false)
      .gt("id", lastId)
      .order("id", { ascending: true })
      .limit(batchSize);

    if (error) throw error;
    if (!profiles || profiles.length === 0) break;

    allProfiles = allProfiles.concat(profiles);
    lastId = profiles[profiles.length - 1].id;

    console.log(
      `\x1b[44m\x1b[1mINFO\x1b[0m: Fetched ${profiles.length} profiles (Total: ${allProfiles.length})`
    );
  }

  return allProfiles;
}

// Fonction principale
async function main() {
  try {
    // Récupérer tous les profils non bannis
    console.log("\x1b[44m\x1b[1mINFO\x1b[0m: Fetching unbanned profiles...");
    const profiles = await fetchAllUnbannedProfiles();

    stats.total = profiles.length;
    console.log(
      `\x1b[44m\x1b[1mINFO\x1b[0m: Found ${profiles.length} unbanned profiles to check`
    );

    // Mettre à jour l'affichage toutes les secondes
    const displayInterval = setInterval(updateDisplay, 1000);

    // Traiter les profils par lots de 40
    const batchSize = 40;
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      await Promise.all(batch.map((profile) => checkProfile(profile)));
    }

    clearInterval(displayInterval);
    updateDisplay();
    console.log("\x1b[42m\x1b[1mSUCCESS\x1b[0m: Ban check completed!");
  } catch (error) {
    console.error("\x1b[41m\x1b[1mERROR\x1b[0m: Script failed:", error);
  }
}

// Lancer le script
console.log("\x1b[45m\x1b[1m=== STEAM BAN CHECK ===\x1b[0m");
main();
