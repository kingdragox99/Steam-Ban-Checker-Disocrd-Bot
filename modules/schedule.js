const cron = require("cron");
const { checkForBan } = require("./checkForBan");

// Fonction pour démarrer le planificateur
function scheduleStart() {
  console.log("\x1b[43m\x1b[1mINFO\x1b[0m: Starting scheduler");

  // Planifie la vérification des bans tous les jours à 23h30
  const job = new cron.CronJob("30 23 * * *", async () => {
    try {
      await checkForBan();
    } catch (error) {
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: Scheduled check failed:",
        error
      );
    }
  });

  job.start();
  console.log(
    "\x1b[42m\x1b[1mSUCCESS\x1b[0m: Scheduler started - Will run daily at 23:30"
  );
}

module.exports = {
  scheduleStart,
};
