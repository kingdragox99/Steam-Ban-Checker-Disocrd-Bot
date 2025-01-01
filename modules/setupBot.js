const supabase = require("./supabBaseConnect");

async function setupBot(guildId, channelId, type) {
  try {
    // Vérifier si le serveur existe déjà
    const { data: existingServer } = await supabase.select("server", "*", {
      where: { guild_id: guildId },
    });

    if (existingServer && existingServer.length > 0) {
      // Mettre à jour le serveur existant
      const updateData =
        type === "input"
          ? { input_channel: channelId }
          : { output_channel: channelId };

      await supabase.update("server", updateData, { guild_id: guildId });
      console.log(
        `\x1b[42m\x1b[1mSUCCESS\x1b[0m: Updated ${type} channel for server ${guildId}`
      );
    } else {
      // Créer un nouveau serveur
      const serverData = {
        guild_id: guildId,
        ...(type === "input"
          ? { input_channel: channelId }
          : { output_channel: channelId }),
      };

      await supabase.insert("server", serverData);
      console.log(
        `\x1b[42m\x1b[1mSUCCESS\x1b[0m: Created new server with ${type} channel ${channelId}`
      );
    }

    return true;
  } catch (error) {
    console.error("\x1b[41m\x1b[1mERROR\x1b[0m: Setup failed:", error);
    throw error;
  }
}

module.exports = setupBot;
