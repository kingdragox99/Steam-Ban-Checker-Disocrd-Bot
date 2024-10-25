const CronJob = require("cron").CronJob;
const checkForBan = require("../modules/checkForBan.js");

// Create a schedule, perform tasks every 1 minute
const scheduleStart = () => {
  var schedule = new CronJob(
    "*/15 * * * *",
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
