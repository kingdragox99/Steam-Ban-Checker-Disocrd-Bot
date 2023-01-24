const CronJob = require("cron").CronJob;
const checkForBan = require("../modules/checkForBan.js");

// Create a schedule every 10s for all tasks
const scheduleStart = () => {
  var schedule = new CronJob(
    "*/2 * * * *",
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
