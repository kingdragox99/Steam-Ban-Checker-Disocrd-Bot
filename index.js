const {
  Client,
  Collection,
  GatewayIntentBits,
  Collector,
} = require("discord.js");
const checker = require("./modules/checker.js");

require("dotenv").config();

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
    message.content.startsWith("https://steamcommunity.com/id/") &&
    message.channel.id === "1066832242543972352"
  ) {
    message.channel.send("PTS Bot surveille : " + message.content);
    message.delete(message.id);
  }

  // test bot is online or not
  if (message.content.startsWith("!ping")) {
    console.log(message);
    message.channel.send("pong " + message.channelId);
  }

  // deleted not valide url
  if (
    message.content.indexOf("https://steamcommunity.com/id/") == -1 &&
    message.content.indexOf("n'est pas un URL valide") == -1 &&
    message.content.indexOf("PTS Bot surveille :") == -1 &&
    message.content.indexOf("pong") == -1 &&
    message.channel.id === "1066832242543972352"
  ) {
    message.channel.send(
      "(" + message.content + ")" + " n'est pas un URL valide"
    );
    message.delete(message.id);
  }
});

checker("https://steamcommunity.com/id/Dragox99/");
