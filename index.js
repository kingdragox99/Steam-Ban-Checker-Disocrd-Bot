const client = require("./modules/initBot.js");
const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const { supabase } = require("./modules/supabBaseConnect.js");
require("dotenv").config();

// Importation optimisée des modules
const setupCheckerInput = require("./modules/setupCheckerInput");
const { scrapSteamProfile } = require("./modules/steamScraper");
const textChecker = require("./modules/textChecker");
const languageChecker = require("./modules/languageChecker");
const languageSeter = require("./modules/languageSeter");
const { checkForBan } = require("./modules/checkForBan");
const schedule = require("node-schedule");

// Cache pour les vérifications fréquentes
const channelCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Statistiques globales
const stats = {
  messagesProcessed: 0,
  profilesAdded: 0,
  invalidMessages: 0,
  errors: 0,
  startTime: Date.now(),
  lastProfile: null,
  lastError: null,
};

// Configuration globale
const DEBUG = process.env.DEBUG === "true";

// Fonction pour créer une barre de séparation
function createSeparator(char = "─", length = process.stdout.columns) {
  return char.repeat(length);
}

// Fonction pour formater le temps
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

// Fonction pour mettre à jour l'affichage
function updateConsole() {
  if (DEBUG) {
    // Mode debug : affichage simple sans effacement
    const uptime = Date.now() - stats.startTime;
    const messagesPerHour = (stats.messagesProcessed / uptime) * 3600000;

    console.log("\n=== STEAM BAN TRACKER DEBUG ===");
    console.log(`Uptime: ${formatTime(uptime)}`);
    console.log(`Messages Processed: ${stats.messagesProcessed}`);
    console.log(`Processing Rate: ${messagesPerHour.toFixed(2)} messages/hour`);
    console.log(`Profiles Added: ${stats.profilesAdded}`);
    console.log(`Invalid Messages: ${stats.invalidMessages}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Last Profile: ${stats.lastProfile || "Aucun"}`);
    console.log(`Last Error: ${stats.lastError || "Aucun"}`);
    console.log("================================\n");
    return;
  }

  // Mode normal : interface stylisée avec positionnement du curseur
  process.stdout.write("\x1b[0m\x1b[?25l"); // Cache le curseur
  process.stdout.write("\x1b[H"); // Déplace le curseur en haut à gauche
  process.stdout.write("\x1b[2J"); // Efface l'écran

  const uptime = Date.now() - stats.startTime;
  const messagesPerHour = (stats.messagesProcessed / uptime) * 3600000;

  // En-tête stylisé
  console.log("\x1b[45m\x1b[1m" + "╔" + "═".repeat(98) + "╗" + "\x1b[0m");
  console.log(
    "\x1b[45m\x1b[1m" +
      "║" +
      " ".repeat(40) +
      "STEAM BAN TRACKER" +
      " ".repeat(41) +
      "║" +
      "\x1b[0m"
  );
  console.log("\x1b[45m\x1b[1m" + "╠" + "═".repeat(98) + "╣" + "\x1b[0m");
  console.log(
    "\x1b[45m\x1b[1m" +
      "║" +
      " ".repeat(25) +
      "Created by \x1b[41m\x1b[1mDragolelele\x1b[45m\x1b[1m" +
      " ".repeat(5) +
      "https://github.com/kingdragox99" +
      " ".repeat(15) +
      "║" +
      "\x1b[0m"
  );
  console.log("\x1b[45m\x1b[1m" + "╚" + "═".repeat(98) + "╝" + "\x1b[0m\n");

  // Statistiques générales
  console.log(
    "\x1b[36m┌──" +
      "─".repeat(30) +
      " GENERAL STATISTICS " +
      "─".repeat(44) +
      "┐\x1b[0m"
  );
  console.log(`\x1b[36m│\x1b[0m • Uptime: ${formatTime(uptime)}`);
  console.log(
    `\x1b[36m│\x1b[0m • Messages Processed: ${stats.messagesProcessed}`
  );
  console.log(
    `\x1b[36m│\x1b[0m • Processing Rate: ${messagesPerHour.toFixed(
      2
    )} messages/hour`
  );
  console.log("\x1b[36m└" + "─".repeat(96) + "┘\x1b[0m\n");

  // Statistiques des profils
  console.log(
    "\x1b[36m┌──" +
      "─".repeat(30) +
      " PROFILE STATISTICS " +
      "─".repeat(44) +
      "┐\x1b[0m"
  );
  console.log(`\x1b[36m│\x1b[0m • Profiles Added: ${stats.profilesAdded}`);
  console.log(`\x1b[36m│\x1b[0m • Invalid Messages: ${stats.invalidMessages}`);
  console.log(`\x1b[36m│\x1b[0m • Errors: ${stats.errors}`);
  console.log("\x1b[36m└" + "─".repeat(96) + "┘\x1b[0m\n");

  // Dernière activité
  console.log(
    "\x1b[36m┌──" +
      "─".repeat(33) +
      " RECENT ACTIVITY " +
      "─".repeat(44) +
      "┐\x1b[0m"
  );
  console.log(
    `\x1b[36m│\x1b[0m • Last Profile: ${stats.lastProfile || "Aucun"}`
  );
  console.log(`\x1b[36m│\x1b[0m • Last Error: ${stats.lastError || "Aucun"}`);
  console.log("\x1b[36m└" + "─".repeat(96) + "┘\x1b[0m");

  process.stdout.write("\x1b[?25h"); // Réaffiche le curseur
}

// Mettre à jour l'affichage toutes les secondes
setInterval(updateConsole, 1000);

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
    stats.errors++;
    stats.lastError = `Failed to deploy commands: ${error.message}`;
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

// Fonction pour gérer les messages contenant des profils Steam
async function handleSteamProfile(message, steamProfileUrl) {
  try {
    stats.messagesProcessed++;

    // Vérifier si le profil existe déjà
    const { data: existingProfile } = await supabase
      .from("profil")
      .select("*")
      .eq("url", steamProfileUrl);

    if (existingProfile && existingProfile.length > 0) {
      await message.channel.send({
        embeds: [
          {
            color: 0xffa500,
            title: "Profil déjà enregistré",
            description: `Le profil ${steamProfileUrl} est déjà dans la base de données.`,
            timestamp: new Date(),
          },
        ],
      });
      return;
    }

    // Récupérer les informations du profil
    const profileData = await scrapSteamProfile(steamProfileUrl);
    if (!profileData) {
      stats.errors++;
      stats.lastError = `Failed to fetch profile data: ${steamProfileUrl}`;
      await message.channel.send({
        embeds: [
          {
            color: 0xff0000,
            title: "Erreur",
            description: `Impossible de récupérer les informations du profil ${steamProfileUrl}`,
            timestamp: new Date(),
          },
        ],
      });
      return;
    }

    // Insérer le nouveau profil
    const { error: insertError } = await supabase.from("profil").insert({
      url: steamProfileUrl,
      steam_name: profileData.name,
      ban: profileData.banStatus,
      ban_type: profileData.banType,
      ban_date: profileData.banDate,
      last_checked: new Date().toISOString(),
      status: "pending",
    });

    if (insertError) {
      stats.errors++;
      stats.lastError = `Failed to insert profile: ${insertError.message}`;
      await message.channel.send({
        embeds: [
          {
            color: 0xff0000,
            title: "Erreur",
            description: `Erreur lors de l'ajout du profil ${steamProfileUrl} à la base de données.`,
            timestamp: new Date(),
          },
        ],
      });
      return;
    }

    stats.profilesAdded++;
    stats.lastProfile = `${profileData.name} (${steamProfileUrl})`;

    // Envoyer un message de confirmation
    await message.channel.send({
      embeds: [
        {
          color: 0x00ff00,
          title: "Profil ajouté avec succès",
          description: `Le profil de **${profileData.name}** a été ajouté à la base de données.`,
          fields: [
            {
              name: "URL",
              value: steamProfileUrl,
              inline: true,
            },
            {
              name: "Statut",
              value: profileData.banStatus ? "🚫 Banni" : "✅ Clean",
              inline: true,
            },
            {
              name: "Type de ban",
              value: profileData.banType || "Aucun",
              inline: true,
            },
          ],
          timestamp: new Date(),
        },
      ],
    });

    // Supprimer le message original après 5 secondes
    setTimeout(() => {
      message.delete().catch(() => {
        stats.errors++;
        stats.lastError = `Failed to delete message for profile: ${steamProfileUrl}`;
      });
    }, 5000);
  } catch (error) {
    stats.errors++;
    stats.lastError = `Error handling profile: ${error.message}`;
    console.error("Error handling Steam profile:", error);
    await message.channel.send({
      embeds: [
        {
          color: 0xff0000,
          title: "Erreur",
          description: "Une erreur est survenue lors du traitement du profil.",
          timestamp: new Date(),
        },
      ],
    });
  }
}

// Gestionnaire d'événements de message
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;

    // Vérifier si c'est un canal input
    const channelData = await checkChannel(message.channelId);

    // Vérifier si c'est un canal output
    const { data: outputChannel } = await supabase
      .from("discord")
      .select("output")
      .eq("output", message.channelId)
      .single();

    // Si c'est un canal output, supprimer le message
    if (outputChannel?.output) {
      await message.delete().catch(() => {
        stats.errors++;
        stats.lastError = "Failed to delete message in output channel";
      });
      return;
    }

    // Si ce n'est pas un canal input, on arrête
    if (!channelData?.input) return;

    const isValidSteamUrl =
      message.content.startsWith("https://steamcommunity.com/id/") ||
      message.content.startsWith("https://steamcommunity.com/profiles/");

    if (isValidSteamUrl) {
      await handleSteamProfile(message, message.content);
    } else {
      const langServerData = await languageChecker(message.guildId);
      if (
        !textChecker(
          message.content,
          languageSeter(langServerData?.lang || "en_EN")
        )
      ) {
        stats.invalidMessages++;
        await message.delete().catch(() => {
          stats.errors++;
          stats.lastError = "Failed to delete invalid message";
        });
      }
    }
  } catch (error) {
    stats.errors++;
    stats.lastError = `Message handling error: ${error.message}`;
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
    // Test de connexion à Supabase
    const { error } = await supabase.from("discord").select("*").limit(1);
    if (error) throw error;
    console.log("\x1b[42m\x1b[1mSUCCESS\x1b[0m: Connected to Supabase");

    // Planifier la vérification quotidienne des bans
    schedule.scheduleJob("30 23 * * *", async () => {
      console.log("\x1b[43m\x1b[1mINFO\x1b[0m: Starting daily ban check");
      await checkForBan();
    });
    console.log(
      "\x1b[42m\x1b[1mSUCCESS\x1b[0m: Scheduled daily ban check for 23:30"
    );

    await deployCommands();
    updateConsole(); // Afficher l'interface initiale
  } catch (error) {
    stats.errors++;
    stats.lastError = `Startup error: ${error.message}`;
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to start application:",
      error
    );
    process.exit(1);
  }
}

startApp();
