const { supabase } = require("../modules/supabBaseConnect");
const { scrapSteamProfile } = require("../modules/steamScraper");
const Bottleneck = require("bottleneck");

// Configuration du limiteur de requêtes
const limiter = new Bottleneck({
  maxConcurrent: 200,
  minTime: 10,
  reservoir: 2000,
  reservoirRefreshAmount: 2000,
  reservoirRefreshInterval: 10 * 1000,
});

// Statistiques
const stats = {
  total: 0,
  processed: 0,
  updated: 0,
  errors: 0,
  startTime: Date.now(),
};

// Fonction pour mettre à jour l'affichage
function updateDisplay() {
  const runTime = Math.floor((Date.now() - stats.startTime) / 1000);
  const profilesPerSecond = stats.processed / runTime;
  const remaining = stats.total - stats.processed;
  const eta = Math.floor(remaining / profilesPerSecond);

  console.clear();
  console.log("\n=== Fix Ban Dates Status ===");
  console.log(`Processed: ${stats.processed}/${stats.total}`);
  console.log(`Updated: ${stats.updated}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Speed: ${profilesPerSecond.toFixed(2)}/s`);
  console.log(`Runtime: ${formatTime(runTime)}`);
  console.log(`ETA: ${formatTime(eta)}`);
  console.log("=========================\n");
}

// Fonction pour formater le temps
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

async function fixBanDates() {
  try {
    console.log("\x1b[43m\x1b[1mINFO\x1b[0m: Starting ban dates fix");

    // Obtenir le nombre total de profils à traiter
    const { count, error: countError } = await supabase
      .from("profil")
      .select("*", { count: "exact", head: true })
      .eq("ban", true)
      .is("ban_date", null);

    if (countError) throw countError;
    stats.total = count;
    console.log(`Found ${stats.total} profiles to fix`);

    // Mettre à jour l'affichage toutes les secondes
    const displayInterval = setInterval(updateDisplay, 1000);

    // Pagination
    let lastId = 0;
    const fetchBatchSize = 1000;
    const processingBatchSize = 100;

    while (true) {
      // Récupérer un lot de profils
      const { data: profiles, error } = await supabase
        .from("profil")
        .select("*")
        .eq("ban", true)
        .is("ban_date", null)
        .gt("id", lastId)
        .order("id", { ascending: true })
        .limit(fetchBatchSize);

      if (error) throw error;
      if (!profiles || profiles.length === 0) break;

      // Mettre à jour le dernier ID pour la prochaine itération
      lastId = profiles[profiles.length - 1].id;

      // Traiter les profils par lots plus petits
      for (let i = 0; i < profiles.length; i += processingBatchSize) {
        const batch = profiles.slice(i, i + processingBatchSize);
        await Promise.all(
          batch.map(async (profile) => {
            try {
              const profileData = await limiter.schedule(() =>
                scrapSteamProfile(profile.url)
              );

              if (profileData && profileData.banDate) {
                // Mettre à jour la date de ban dans la base de données
                await supabase
                  .from("profil")
                  .update({ ban_date: profileData.banDate })
                  .eq("url", profile.url);

                stats.updated++;
              }

              stats.processed++;
            } catch (error) {
              stats.errors++;
              console.error(
                `\x1b[41m\x1b[1mERROR\x1b[0m: Failed to fix profile ${profile.url}:`,
                error.message
              );
            }
          })
        );
      }

      console.log(
        `\x1b[44m\x1b[1mINFO\x1b[0m: Processed batch of ${profiles.length} profiles (Last ID: ${lastId})`
      );
    }

    clearInterval(displayInterval);
    updateDisplay();
    console.log("\x1b[42m\x1b[1mSUCCESS\x1b[0m: Ban dates fix completed!");
  } catch (error) {
    console.error("\x1b[41m\x1b[1mERROR\x1b[0m: Ban dates fix failed:", error);
  }
}

// Exécuter le script
fixBanDates();
