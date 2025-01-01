const { supabase } = require("./supabBaseConnect");
const { scrapSteamProfile } = require("./steamScraper");
const languageChecker = require("./languageChecker");
const languageSeter = require("./languageSeter");
const Bottleneck = require("bottleneck");

// Configuration du limiteur de requêtes optimisé
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

// Fonction pour formater le temps
function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "∞";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

// Fonction pour mettre à jour l'affichage
function updateDisplay() {
  const runTime = Math.floor((Date.now() - stats.startTime) / 1000);
  const profilesPerSecond = stats.processed / runTime;
  const remaining = stats.total - stats.processed;
  const eta = Math.floor(remaining / profilesPerSecond);
  const progress = stats.total > 0 ? stats.processed / stats.total : 0;

  // Position le curseur en bas de l'écran
  process.stdout.write("\x1b[0m\x1b[?25l"); // Cache le curseur
  process.stdout.write("\x1b[s"); // Sauvegarde la position
  process.stdout.write("\x1b[J"); // Efface jusqu'à la fin de l'écran

  // En-tête du daily check
  console.log(
    "\n\x1b[33m┌──" +
      "─".repeat(30) +
      " DAILY CHECK STATUS " +
      "─".repeat(31) +
      "┐\x1b[0m"
  );

  // Barre de progression
  console.log(`\x1b[33m│\x1b[0m Progress: [${createProgressBar(progress)}]`);

  // Statistiques sur une seule ligne
  console.log(
    `\x1b[33m│\x1b[0m Stats: ${stats.processed}/${stats.total} profiles | ` +
      `New Bans: ${stats.newBans} | ` +
      `Errors: ${stats.errors}`
  );

  // Performance sur une seule ligne
  console.log(
    `\x1b[33m│\x1b[0m Speed: ${profilesPerSecond.toFixed(2)}/s | ` +
      `Runtime: ${formatTime(runTime)} | ` +
      `ETA: ${formatTime(eta)}`
  );

  // Dernière mise à jour
  if (stats.lastUpdate) {
    console.log(`\x1b[33m│\x1b[0m Last Update: ${stats.lastUpdate}`);
  }

  console.log("\x1b[33m└" + "─".repeat(96) + "┘\x1b[0m");

  process.stdout.write("\x1b[u"); // Restaure la position
  process.stdout.write("\x1b[?25h"); // Affiche le curseur
}

async function checkForBan() {
  try {
    console.log("\x1b[43m\x1b[1mINFO\x1b[0m: Starting ban check");

    // Réinitialiser les statistiques
    stats.startTime = Date.now();
    stats.processed = 0;
    stats.newBans = 0;
    stats.errors = 0;
    stats.lastUpdate = null;

    // Récupérer tous les profils à vérifier
    const { data: profiles, error } = await supabase.from("profil").select("*");
    if (error) throw error;

    stats.total = profiles.length;

    // Récupérer tous les serveurs pour les notifications
    const { data: servers } = await supabase.from("discord").select("*");
    if (!servers || servers.length === 0) {
      console.log("\x1b[43m\x1b[1mWARN\x1b[0m: No servers configured");
      return;
    }

    // Mettre à jour l'affichage toutes les secondes
    const displayInterval = setInterval(updateDisplay, 1000);

    // Traiter les profils par lots
    const batchSize = 100;
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (profile) => {
          try {
            const profileData = await limiter.schedule(() =>
              scrapSteamProfile(profile.url)
            );
            if (!profileData) return;

            // Si le statut de ban a changé
            if (profileData.banStatus !== profile.ban) {
              stats.newBans++;
              stats.lastUpdate = `${profile.url} → ${
                profileData.banType || "unknown"
              }`;

              // Mettre à jour le profil dans la base de données
              await supabase
                .from("profil")
                .update({
                  ban: profileData.banStatus,
                  ban_type: profileData.banType,
                  ban_date: profileData.banDate,
                  steam_name: profileData.name,
                  last_checked: new Date().toISOString(),
                })
                .eq("url", profile.url);

              // Envoyer des notifications à tous les serveurs configurés
              for (const server of servers) {
                if (!server.output) continue;

                const langData = await languageChecker(server.id_server);
                const lang = languageSeter(langData?.lang || "en_EN");

                const channel = await client.channels.fetch(server.output);
                if (!channel) continue;

                await channel.send(
                  `${lang.response_banned}\n` +
                    `${profile.url}\n` +
                    `${lang.response_name} ${profileData.name}\n` +
                    `${lang.response_type} ${
                      profileData.banType || "unknown"
                    }\n` +
                    `${lang.response_date} ${profileData.banDate || "unknown"}`
                );
              }
            }

            stats.processed++;
          } catch (error) {
            stats.errors++;
            console.error(
              `\x1b[41m\x1b[1mERROR\x1b[0m: Failed to check profile ${profile.url}:`,
              error.message
            );
          }
        })
      );
    }

    clearInterval(displayInterval);
    updateDisplay();
    console.log("\x1b[42m\x1b[1mSUCCESS\x1b[0m: Ban check completed!");
  } catch (error) {
    console.error("\x1b[41m\x1b[1mERROR\x1b[0m: Ban check failed:", error);
  }
}

module.exports = {
  checkForBan,
};
