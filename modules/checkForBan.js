const supabase = require("./supabBaseConnect");
const { scrapSteamProfile } = require("./steamScraper");
const languageChecker = require("./languageChecker");
const languageSeter = require("./languageSeter");

async function checkForBan() {
  try {
    console.log("\x1b[43m\x1b[1mINFO\x1b[0m: Starting ban check");

    // Récupérer tous les profils à vérifier
    const { data: profiles, error } = await supabase.select("profil", "*");
    if (error) throw error;

    // Récupérer tous les serveurs pour les notifications
    const { data: servers } = await supabase.select("server", "*");
    if (!servers || servers.length === 0) {
      console.log("\x1b[43m\x1b[1mWARN\x1b[0m: No servers configured");
      return;
    }

    let updatedProfiles = 0;
    let newBans = 0;

    // Vérifier chaque profil
    for (const profile of profiles) {
      try {
        const profileData = await scrapSteamProfile(profile.url);
        if (!profileData) continue;

        // Si le statut de ban a changé
        if (profileData.banStatus !== profile.ban) {
          newBans++;

          // Mettre à jour le profil dans la base de données
          await supabase.update(
            "profil",
            {
              ban: profileData.banStatus,
              ban_type: profileData.banType,
              ban_date: profileData.banDate,
              steam_name: profileData.name,
              last_checked: profileData.lastChecked,
            },
            { url: profile.url }
          );

          // Envoyer des notifications à tous les serveurs configurés
          for (const server of servers) {
            if (!server.output_channel) continue;

            const langData = await languageChecker(server.guild_id);
            const lang = languageSeter(langData?.lang || "en_EN");

            const channel = await client.channels.fetch(server.output_channel);
            if (!channel) continue;

            await channel.send(
              `${lang.response_banned}\n` +
                `${profile.url}\n` +
                `${lang.response_name} ${profileData.name}\n` +
                `${lang.response_type} ${profileData.banType || "Unknown"}\n` +
                `${lang.response_date} ${profileData.banDate || "Unknown"}`
            );
          }
        }

        updatedProfiles++;
      } catch (error) {
        console.error(
          `\x1b[41m\x1b[1mERROR\x1b[0m: Failed to check profile ${profile.url}:`,
          error.message
        );
        continue;
      }
    }

    console.log(
      `\x1b[42m\x1b[1mSUCCESS\x1b[0m: Ban check completed\n` +
        `Profiles checked: ${updatedProfiles}/${profiles.length}\n` +
        `New bans found: ${newBans}`
    );
  } catch (error) {
    console.error("\x1b[41m\x1b[1mERROR\x1b[0m: Ban check failed:", error);
  }
}

module.exports = {
  checkForBan,
};
