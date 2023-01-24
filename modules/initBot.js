const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

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
  console.log(
    `\x1b[41m\x1b[1mBOT:\x1b[0m Logged in as \x1b[1m\x1b[31m${client.user.tag}\x1b[0m!`
  );
});

client.login(process.env.CLIENT_TOKEN);

module.exports = client;
