const {
  Client,
  GatewayIntentBits,
  ChannelType,
  Collection,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

// Configuration optimisée du client Discord
const client = new Client({
  shards: "auto",
  allowedMentions: {
    parse: ["users", "roles"],
    repliedUser: true,
  },
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  presence: {
    status: "online",
    activities: [
      {
        name: "Steam Ban Tracker",
        type: 3,
      },
    ],
  },
  // Optimisation des ressources
  restTimeOffset: 0,
  restRequestTimeout: 15000,
  retryLimit: 3,
  failIfNotExists: false,
});

// Chargement des commandes
client.commands = new Collection();
const commandsPath = path.join(__dirname, "..", "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(
      `\x1b[43m\x1b[1mWARN\x1b[0m: The command at ${filePath} is missing required properties.`
    );
  }
}

// Gestion des commandes
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(
      `\x1b[41m\x1b[1mERROR\x1b[0m: Error executing command:`,
      error
    );
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error executing this command!",
        ephemeral: true,
      });
    }
  }
});

// Gestion optimisée des événements
client.on("ready", () => {
  console.log(`\x1b[42m\x1b[1mSUCCESS\x1b[0m: Logged in as ${client.user.tag}`);

  // Optimisation de la mémoire du cache
  client.guilds.cache.forEach((guild) => {
    guild.members.cache.clear();
    guild.channels.cache.sweep(
      (channel) =>
        ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(
          channel.type
        )
    );
  });
});

// Gestion des erreurs
client.on("error", (error) => {
  console.error(`\x1b[41m\x1b[1mERROR\x1b[0m: Discord client error:`, error);
});

client.on("warn", (warning) => {
  console.warn(`\x1b[43m\x1b[1mWARN\x1b[0m: Discord client warning:`, warning);
});

// Gestion de la déconnexion
client.on("disconnect", () => {
  console.warn(`\x1b[43m\x1b[1mWARN\x1b[0m: Bot disconnected from Discord`);
});

// Gestion de la reconnexion
client.on("reconnecting", () => {
  console.log(`\x1b[43m\x1b[1mINFO\x1b[0m: Bot reconnecting to Discord`);
});

// Connexion avec retry
async function connectWithRetry(maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await client.login(process.env.CLIENT_TOKEN);
      break;
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error(
          `\x1b[41m\x1b[1mERROR\x1b[0m: Failed to connect after ${maxAttempts} attempts:`,
          error
        );
        process.exit(1);
      }
      console.warn(
        `\x1b[43m\x1b[1mWARN\x1b[0m: Connection attempt ${attempt} failed, retrying in 5s...`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// Démarrer la connexion
connectWithRetry();

module.exports = client;
