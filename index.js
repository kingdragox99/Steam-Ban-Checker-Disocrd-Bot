// Import
const mongoose = require("mongoose");
const SteamIDConverter = require("steamidconverter");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Collector,
} = require("discord.js");
const checker = require("./modules/checker.js");
const Profile = require("./model/profile.js");

require("dotenv").config();

// DB connect

mongoose.set("strictQuery", false);

mongoose.connect(process.env.MONGO_URL, (err) => {
  if (err) console.log(err);
  else console.log("mongdb is connected");
});

// Creat Discord Bot

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
  console.log(`Logged in as ${client.user.tag}!`);
});

client.login(process.env.CLIENT_TOKEN);

client.on("messageCreate", async (message) => {
  // check new url
  if (
    message.content.startsWith("https://steamcommunity.com/") &&
    message.channel.id === "1066832242543972352"
  ) {
    message.channel.send("PTS Bot surveille : " + message.content);
    const newUrl = await Profile.create({
      url: message.content,
      ban: await checker(message.content),
      user: message.author.username,
    });
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
    message.channel.id === "1066832242543972352"
  ) {
    message.channel.send(
      "Votre message n'est pas un URL ou une commande valide"
    );
    message.delete(message.id);
  }
});
