const client = require("./modules/initBot.js");
const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const supabase = require("./modules/supabBaseConnect.js");
require("dotenv").config();

// Importation optimisée des modules
const {
  setupCheckerInput,
  scrapSteamProfile,
  textChecker,
  languageChecker,
  languageSeter,
  scheduleStart,
} = require("./modules/index.js");

// Cache pour les vérifications fréquentes
const channelCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fonction optimisée pour le déploiement des commandes
async function deployCommands() {
  try {
    const commands = [];
    const commandsPath = path.join(__dirname, "commands");
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const command = require(`./commands/${file}`);
      if (!command.data || !command.execute) {
        console.warn(
          `\x1b[43m\x1b[1mWARN\x1b[0m: Invalid command file: ${file}`
        );
        continue;
      }
      commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: "10" }).setToken(process.env.CLIENT_TOKEN);
    console.log(
      `\x1b[43m\x1b[1mINFO\x1b[0m: Refreshing ${commands.length} application (/) commands.`
    );

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log(
      `\x1b[42m\x1b[1mSUCCESS\x1b[0m: Reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(
      `\x1b[41m\x1b[1mERROR\x1b[0m: Error deploying commands:`,
      error
    );
  }
}

// Fonction optimisée pour vérifier le canal
async function checkChannel(channelId) {
  const now = Date.now();
  const cached = channelCache.get(channelId);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await setupCheckerInput(channelId);
  channelCache.set(channelId, { data, timestamp: now });
  return data;
}

// Gestionnaire d'événements de message
client.on("messageCreate", async (message) => {
  try {
    // Ignorer les messages du bot
    if (message.author.bot) return;

    const checkerInput = await checkChannel(message.channelId);
    if (!checkerInput?.input) return;

    const langServerData = await languageChecker(message.guildId);
    const isValidSteamUrl =
      message.content.startsWith("https://steamcommunity.com/id/") ||
      message.content.startsWith("https://steamcommunity.com/profiles/");

    if (isValidSteamUrl) {
      console.log(
        `\x1b[42m\x1b[1mPROFILE\x1b[0m: New Steam profile added\n` +
          `Server: ${message.guild.name} (${message.guild.id})\n` +
          `Channel: #${message.channel.name} (${message.channel.id})\n` +
          `Profile: ${message.content}`
      );

      // Traiter le profil Steam
      const profileData = await scrapSteamProfile(message.content);
      if (!profileData) {
        console.error(
          "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to retrieve profile data"
        );
        return;
      }

      try {
        // Supprimer le message original
        await message.delete();

        // Envoyer le message de confirmation
        await message.channel.send(
          `${languageSeter(langServerData?.lang || "en_EN").response_watch} ${
            message.content
          }`
        );

        // Insérer dans la base de données
        await supabase.query(() =>
          supabase.supabase.from("profil").insert({
            url: message.content,
            steam_name: profileData.name,
            ban: profileData.banStatus,
            ban_type: profileData.banType,
            ban_date: profileData.banDate,
            last_checked: profileData.lastChecked,
          })
        );

        console.log(
          `\x1b[42m\x1b[1mSUCCESS\x1b[0m: Profile processed\n` +
            `Name: ${profileData.name}\n` +
            `Ban Status: ${profileData.banStatus}\n` +
            `Ban Type: ${profileData.banType || "None"}\n` +
            `Ban Date: ${profileData.banDate || "N/A"}`
        );
      } catch (error) {
        console.error(
          "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to process profile:",
          error
        );
      }
      return;
    }

    // Si ce n'est pas un profil Steam valide, vérifier si le message doit être supprimé
    if (
      !textChecker(
        message.content,
        languageSeter(langServerData?.lang || "en_EN")
      )
    ) {
      await message.delete();
      console.log(
        `\x1b[43m\x1b[1mDELETE\x1b[0m: Invalid message removed\n` +
          `Server: ${message.guild.name} (${message.guild.id})\n` +
          `Channel: #${message.channel.name} (${message.channel.id})\n` +
          `Content: ${message.content}\n` +
          `Author: ${message.author.tag} (${message.author.id})`
      );
    }
  } catch (error) {
    console.error(
      `\x1b[41m\x1b[1mERROR\x1b[0m: Message handling error:`,
      error
    );
  }
});

// Nettoyage périodique du cache
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of channelCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      channelCache.delete(key);
    }
  }
}, CACHE_TTL);

// Démarrage de l'application
async function startApp() {
  console.log(
    "\x1b[42m\x1b[1mSTART\x1b[0m: Steam Ban Tracker by \x1b[41m\x1b[1mDragolelele\x1b[0m"
  );

  try {
    await supabase.testConnection();
    await deployCommands();
    scheduleStart();
  } catch (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to start application:",
      error
    );
    process.exit(1);
  }
}

startApp();
