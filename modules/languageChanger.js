const supabase = require("./supabBaseConnect");

async function languageChanger(guildId, newLang) {
  try {
    // Vérifier si le serveur existe
    const { data: existingServer } = await supabase.select("server", "*", {
      where: { guild_id: guildId },
    });

    if (existingServer && existingServer.length > 0) {
      // Mettre à jour la langue du serveur
      await supabase.update("server", { lang: newLang }, { guild_id: guildId });
      console.log(
        `\x1b[42m\x1b[1mSUCCESS\x1b[0m: Updated language to ${newLang} for server ${guildId}`
      );
    } else {
      // Créer un nouveau serveur avec la langue spécifiée
      await supabase.insert("server", {
        guild_id: guildId,
        lang: newLang,
      });
      console.log(
        `\x1b[42m\x1b[1mSUCCESS\x1b[0m: Created new server with language ${newLang}`
      );
    }

    return true;
  } catch (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Language change failed:",
      error
    );
    throw error;
  }
}

module.exports = languageChanger;
