const dbConnect = require("./modules/dbConnect.js");
const client = require("./modules/initBot.js");
const setupCheckerInput = require("./modules/setupCheckerInput.js");
const scheduleStart = require("./modules/schedule.js");
const scapBan = require("./modules/scapBan.js");
const scapName = require("./modules/scapName.js");
const Profile = require("./model/profile.js");
const Setup = require("./model/setup.js");

dbConnect(); // connect to DB
scheduleStart(); // Start daily task

// Get new message
client.on("messageCreate", async (message) => {
  const checkerInput = await setupCheckerInput(message.channelId);

  // Check for new URLs
  if (
    message.content.startsWith("https://steamcommunity.com/") &&
    message.channelId == checkerInput?.input
  ) {
    message.channel.send("PTS Bot surveille : " + message.content);
    // Push a new user in DB
    const newUrl = await Profile.create({
      url: message.content,
      ban: await scapBan(message.content),
      slut: await scapName(message.content),
      user: message.author.username,
    });
    // Delete user message
    message.delete(message.id);
  }

  // Debug command
  if (message.content.startsWith("!ping")) {
    message.channel.send("pong " + message.channelId);
  }

  // Deleted invalid url or invalid input
  if (
    message.content.indexOf("https://steamcommunity.com/") == -1 &&
    message.content.indexOf(
      "Votre message n'est pas un URL ou une commande valide"
    ) == -1 &&
    message.content.indexOf("PTS Bot surveille :") == -1 &&
    message.content.indexOf("pong") == -1 &&
    message.content.indexOf("Ce channel est le nouveau channel d'entrée") ==
      -1 &&
    message.content.indexOf("Ce channel est le nouveau channel de sortie") ==
      -1 &&
    message.content.indexOf(
      "Valve à fais son travail une pute a été trouvée"
    ) == -1 &&
    message.channelId == checkerInput?.input
  ) {
    message.delete(message.id);
  }

  // Setup command input
  if (message.content.startsWith("!setup input")) {
    const guildId = { idserver: message.guildId };
    const channelId = { input: message.channelId };

    message.channel.send("Ce channel est le nouveau channel d'entrée");

    // Check if the discord server is already on the DB
    Setup.exists({ idserver: message.guildId }).then(async (exists) => {
      if (exists) {
        //If there is an update
        let update = await Setup.findOneAndUpdate(guildId, channelId, {
          new: true,
        });
      } else {
        //Else, create one
        const newInput = await Setup.create({
          idserver: message.guildId,
          input: message.channelId,
        });
      }
    });
  }
  // Setup command output
  if (message.content.startsWith("!setup output")) {
    const guildId = { idserver: message.guildId };
    const channelId = { output: message.channelId };

    message.channel.send("Ce channel est le nouveau channel de sortie");

    // Check if the discord server is already on the DB
    Setup.exists({ idserver: message.guildId }).then(async (exists) => {
      //If there is an update
      if (exists) {
        let update = await Setup.findOneAndUpdate(guildId, channelId, {
          new: true,
        });
      } else {
        //Else, create one
        const newOutput = await Setup.create({
          idserver: message.guildId,
          output: message.channelId,
        });
      }
    });
  }
});
