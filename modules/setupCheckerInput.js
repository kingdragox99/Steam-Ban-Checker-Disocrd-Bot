const { supabase } = require("./supabBaseConnect");

async function setupCheckerInput(channelId) {
  try {
    const { data, error } = await supabase
      .from("discord")
      .select("*")
      .eq("input", channelId)
      .single();

    if (error) {
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to check input channel:",
        error.message
      );
      return null;
    }

    return data;
  } catch (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Error in setupCheckerInput:",
      error.message
    );
    return null;
  }
}

module.exports = setupCheckerInput;
