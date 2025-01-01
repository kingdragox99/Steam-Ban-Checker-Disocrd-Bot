const supabase = require("./supabBaseConnect");

async function setupCheckerInput(channelId) {
  try {
    const { data: server } = await supabase.select("server", "*", {
      where: { input_channel: channelId },
    });

    return {
      input: server && server.length > 0,
      data: server?.[0] || null,
    };
  } catch (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to check input channel:",
      error
    );
    return { input: false, data: null };
  }
}

module.exports = setupCheckerInput;
