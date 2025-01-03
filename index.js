const client = require("./modules/initBot.js");
const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const { supabase } = require("./modules/supabBaseConnect.js");
require("dotenv").config();

// Importation des modules
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

// Statistiques basiques pour le logging
const stats = {
  messagesProcessed: 0,
  profilesAdded: 0,
  invalidMessages: 0,
  errors: 0,
  startTime: Date.now(),
};

// Fonction pour déployer les commandes
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
        console.warn(`Warning: Invalid command file: ${file}`);
        continue;
      }
      commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: "10" }).setToken(process.env.CLIENT_TOKEN);
    console.log(`Refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error("Error deploying commands:", error);
    stats.errors++;
  }
}

// Fonction pour vérifier le canal
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

    const { data: existingProfile } = await supabase
      .from("profil")
      .select("*")
      .eq("url", steamProfileUrl);

    if (existingProfile && existingProfile.length > 0) {
      await message.channel.send({
        embeds: [
          {
            color: 0xffa500,
            title: "Profile already registered",
            description: `The profile ${steamProfileUrl} is already in the database.`,
            timestamp: new Date(),
          },
        ],
      });
      return;
    }

    const profileData = await scrapSteamProfile(steamProfileUrl);
    if (!profileData) {
      stats.errors++;
      await message.channel.send({
        embeds: [
          {
            color: 0xff0000,
            title: "Error",
            description: `Unable to fetch profile data for ${steamProfileUrl}`,
            timestamp: new Date(),
          },
        ],
      });
      return;
    }

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
      throw insertError;
    }

    stats.profilesAdded++;

    await message.channel.send({
      embeds: [
        {
          color: 0x00ff00,
          title: "Profile added successfully",
          description: `Profile **${profileData.name}** has been added to the database.`,
          fields: [
            { name: "URL", value: steamProfileUrl, inline: true },
            {
              name: "Status",
              value: profileData.banStatus ? "🚫 Banned" : "✅ Clean",
              inline: true,
            },
            {
              name: "Ban Type",
              value: profileData.banType || "None",
              inline: true,
            },
          ],
          timestamp: new Date(),
        },
      ],
    });

    setTimeout(() => message.delete().catch(console.error), 5000);
  } catch (error) {
    stats.errors++;
    console.error("Error handling Steam profile:", error);
    await message.channel.send({
      embeds: [
        {
          color: 0xff0000,
          title: "Error",
          description: "An error occurred while processing the profile.",
          timestamp: new Date(),
        },
      ],
    });
  }
}

// Event handlers
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;

    const channelData = await checkChannel(message.channelId);
    const { data: outputChannel } = await supabase
      .from("discord")
      .select("output")
      .eq("output", message.channelId)
      .single();

    if (outputChannel?.output) {
      await message.delete().catch(console.error);
      return;
    }

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
        await message.delete().catch(console.error);
      }
    }
  } catch (error) {
    stats.errors++;
    console.error("Message handling error:", error);
  }
});

// Cache cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of channelCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      channelCache.delete(key);
    }
  }
}, CACHE_TTL);

// App startup
async function startApp() {
  console.log("Starting Steam Ban Tracker");

  try {
    const { error } = await supabase.from("discord").select("*").limit(1);
    if (error) throw error;
    console.log("Connected to Supabase");

    schedule.scheduleJob("30 23 * * *", async () => {
      console.log("Starting daily ban check");
      await checkForBan(client);
    });
    console.log("Scheduled daily ban check for 23:30");

    await deployCommands();
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

startApp();
