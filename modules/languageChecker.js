const supabase = require("./supabBaseConnect");

async function languageChecker(guildId) {
  try {
    const { data: server } = await supabase.select("server", "*", {
      where: { guild_id: guildId },
    });

    return server?.[0] || null;
  } catch (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to check server language:",
      error
    );
    return null;
  }
}

module.exports = languageChecker;
