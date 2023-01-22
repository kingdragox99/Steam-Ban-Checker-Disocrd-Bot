const { Client, GatewayIntentBits } = require("discord.js");
const checker = require("./modules/checker.js");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.login(process.env.CLIENT_TOKEN);

checker("https://steamcommunity.com/id/Dragox99/");
