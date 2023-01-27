const dbConnect = require("./modules/dbConnect.js");
const client = require("./modules/initBot.js");
const setupCheckerInput = require("./modules/setupCheckerInput.js");
const scheduleStart = require("./modules/schedule.js");
const scapBan = require("./modules/scapBan.js");
const scapName = require("./modules/scapName.js");
const Profile = require("./model/profile.js");
const textChecker = require("./modules/textChecker.js");
const setupBot = require("./modules/setupBot.js");

console.log(
  "\x1b[41m\x1b[1mBOT:\x1b[0m This \x1b[31m\x1b[1mBOT\x1b[0m was made with Love by \x1b[41m\x1b[1mDragolelele\x1b[0m"
);

dbConnect(); // connect to DB
scheduleStart(); // Start daily task

// Get new message
client.on("messageCreate", async (message) => {
  const checkerInput = await setupCheckerInput(message.channelId);

  // Check for new URLs
  if (
    (message.content.startsWith("https://steamcommunity.com/id/") ||
      message.content.startsWith("https://steamcommunity.com/profiles/")) &&
    message.channelId == checkerInput?.input
  ) {
    console.log(
      `\x1b[41m\x1b[1mBOT:\x1b[0m We keep an eye on \x1b[45m\x1b[1m\x1b[31m ${message.content} \x1b[0m`
    );
    message.channel.send("PTS Bot surveille : " + message.content);
    // Push a new user in DB
    const newSurveil = await Profile.create({
      ID_server: message.guildId,
      watcher_user: message.author.username,
      url: message.content,
      watch_user: await scapName(message.content),
      ban: await scapBan(message.content),
    });
    // Delete user message
    message.delete(message.id);
  }

  // Debug command
  if (message.content.startsWith("!ping")) {
    message.channel.send("pong " + message.channelId);
  }

  // Deleted invalid url or invalid command
  if (
    textChecker(message.content) == false &&
    message.channelId == checkerInput?.input
  ) {
    message.delete(message.id);
    console.log(
      `\x1b[41m\x1b[1mBOT:\x1b[0m This message has been deleted: \x1b[1m\x1b[33m${message.content}\x1b[0m`
    );
  }

  // Setup command input
  if (message.content.startsWith("!setup input")) {
    message.channel.send("Ce channel est le nouveau channel d'entrée");
    setupBot(message.guildId, message.channelId, "input");
  }

  // Setup command output
  if (message.content.startsWith("!setup output")) {
    message.channel.send("Ce channel est le nouveau channel de sortie");
    setupBot(message.guildId, message.channelId, "output");
  }
});
