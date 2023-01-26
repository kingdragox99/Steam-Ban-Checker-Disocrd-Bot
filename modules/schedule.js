const CronJob = require("cron").CronJob;
const checkForBan = require("../modules/checkForBan.js");

// Create a schedule every 1m for all tasks
const scheduleStart = () => {
  var schedule = new CronJob(
    "*/1 * * * *",
    async function () {
      checkForBan();
    },
    null,
    true,
    "Europe/Paris",
    true
  );
};

module.exports = scheduleStart;
