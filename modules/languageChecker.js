const { supabase } = require("./supabBaseConnect");

async function languageChecker(serverId) {
  try {
    const { data, error } = await supabase
      .from("discord")
      .select("lang")
      .eq("id_server", serverId)
      .single();

    if (error) {
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to check server language:",
        error.message
      );
      return null;
    }

    return data;
  } catch (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Error in languageChecker:",
      error.message
    );
    return null;
  }
}

module.exports = languageChecker;
