// Import
const mongoose = require("mongoose");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Collector,
} = require("discord.js");
const checker = require("./modules/checker.js");
const setupCheckerInput = require("./modules/setupCheckerInput.js");
const setupCheckerOutput = require("./modules/setupCheckerInput.js");
const Profile = require("./model/profile.js");
const Setup = require("./model/setup.js");

require("dotenv").config();

// DB connect

mongoose.set("strictQuery", false);

mongoose.connect(process.env.MONGO_URL, (err) => {
  if (err) console.log(err);
  else console.log("\x1b[1m\x1b[32mMongoDB\x1b[0m is connected");
});

// Create Discord Bot

const client = new Client({
  shards: "auto",
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`Logged in as \x1b[1m\x1b[31m${client.user.tag}\x1b[0m!`);
});

client.login(process.env.CLIENT_TOKEN);

// setup bot
client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!setup input")) {
    const guildId = { idserver: message.guildId };
    const channelId = { input: message.channelId };

    message.channel.send(
      "PTS Bot : ce channel est le nouveau channel d'entrée"
    );

    Setup.exists({ idserver: message.guildId }).then(async (exists) => {
      if (exists) {
        let update = await Setup.findOneAndUpdate(guildId, channelId, {
          new: true,
        });
      } else {
        const newInput = await Setup.create({
          idserver: message.guildId,
          input: message.channelId,
        });
      }
    });
  }
  if (message.content.startsWith("!setup output")) {
    const guildId = { idserver: message.guildId };
    const channelId = { output: message.channelId };

    message.channel.send(
      "PTS Bot : ce channel est le nouveau channel de sortie"
    );

    Setup.exists({ idserver: message.guildId }).then(async (exists) => {
      if (exists) {
        let update = await Setup.findOneAndUpdate(guildId, channelId, {
          new: true,
        });
      } else {
        const newOutput = await Setup.create({
          idserver: message.guildId,
          output: message.channelId,
        });
      }
    });
  }
});

// init command bot
client.on("messageCreate", async (message) => {
  const checkerInput = await setupCheckerInput(message.channelId);
  // check new url
  if (
    message.content.startsWith("https://steamcommunity.com/") &&
    message.channelId == checkerInput?.input
  ) {
    // confirmation message by bot
    message.channel.send("PTS Bot surveille : " + message.content);
    // Put new user in DB
    const newUrl = await Profile.create({
      url: message.content,
      ban: await checker(message.content),
      user: message.author.username,
    });
    // delete user message
    message.delete(message.id);
  }

  // test bot is online or not
  if (message.content.startsWith("!ping")) {
    console.log(message);
    message.channel.send("pong " + message.channelId);
  }

  // deleted not valide url
  if (
    message.content.indexOf("https://steamcommunity.com/") == -1 &&
    message.content.indexOf(
      "Votre message n'est pas un URL ou une commande valide"
    ) == -1 &&
    message.content.indexOf("PTS Bot surveille :") == -1 &&
    message.content.indexOf("pong") == -1 &&
    message.content.indexOf(
      "PTS Bot : ce channel est le nouveau channel d'entrée"
    ) == -1 &&
    message.content.indexOf(
      "PTS Bot : ce channel est le nouveau channel d'entrée"
    ) == -1 &&
    message.channelId == checkerInput?.input
  ) {
    message.delete(message.id);
  }
});
