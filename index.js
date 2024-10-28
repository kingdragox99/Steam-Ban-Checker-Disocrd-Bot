const client = require("./modules/initBot.js");
const setupCheckerInput = require("./modules/setupCheckerInput.js");
const scheduleStart = require("./modules/schedule.js");
const scapBan = require("./modules/scapBan.js");
const scapName = require("./modules/scapName.js");
const textChecker = require("./modules/textChecker.js");
const setupBot = require("./modules/setupBot.js");
const languageChanger = require("./modules/languageChanger.js");
const languageChecker = require("./modules/languageChecker.js");
const languageSeter = require("./modules/languageSeter.js");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

console.log(
  "\x1b[41m\x1b[1mBOT:\x1b[0m This \x1b[31m\x1b[1mBOT\x1b[0m was made with Love by \x1b[41m\x1b[1mDragolelele\x1b[0m"
);

scheduleStart(); // Start daily task

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Test connection to Supabase
(async () => {
  const { error } = await supabase.from("profil").select("id").limit(1);
  if (error) {
    console.error("Failed to connect to Supabase: ", error);
  } else {
    console.log(
      "\x1b[41m\x1b[1mBOT:\x1b[0m \x1b[32mSuccessfully connected to Supabase database.\x1b[0m"
    );
  }
})();

// Utility function for retry logic
async function retryOperation(operation, maxAttempts = 3) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    const result = await operation();
    if (!result.error) {
      return result;
    }
    console.log(`Attempt ${attempt + 1} failed:`, result.error);
    attempt++;
  }
  console.error(
    "Failed to complete operation after multiple attempts. Please check the connection or data consistency."
  );
  return { error: true };
}

// Get new message
client.on("messageCreate", async (message) => {
  const checkerInput = await setupCheckerInput(message.channelId);
  const langServerData = await languageChecker(message.guildId);

  // Check for new URLs
  if (
    (message.content.startsWith("https://steamcommunity.com/id/") ||
      message.content.startsWith("https://steamcommunity.com/profiles/")) &&
    message.channelId == checkerInput?.input
  ) {
    console.log(
      `\x1b[41m\x1b[1mBOT:\x1b[0m We keep an eye on \x1b[45m\x1b[1m\x1b[31m ${message.content} \x1b[0m`
    );
    message.channel.send(
      `${languageSeter(langServerData?.lang || "en_EN").response_watch} ${
        message.content
      }`
    );

    // Push a new user in db with retry logic
    await retryOperation(async () => {
      return await supabase.from("profil").insert({
        url: message.content,
        watch_user: await scapName(message.content),
        ban: await scapBan(message.content),
      });
    });

    // Delete user message
    message.delete(message.id);
  }

  // Setup command input
  if (
    message.content.startsWith(
      `${languageSeter(langServerData?.lang || "en_EN").command_input}`
    )
  ) {
    message.channel.send(
      `${languageSeter(langServerData?.lang || "en_EN").text_input}`
    );
    setupBot(message.guildId, message.channelId, "input");
  }

  // Setup command output
  if (
    message.content.startsWith(
      `${languageSeter(langServerData?.lang || "en_EN").command_output}`
    )
  ) {
    message.channel.send(
      `${languageSeter(langServerData?.lang || "en_EN").text_output}`
    );
    setupBot(message.guildId, message.channelId, "output");
  }

  // Debug command
  if (
    message.content.startsWith(
      `${languageSeter(langServerData?.lang || "en_EN").command_ping}`
    )
  ) {
    message.channel.send(`pong ${message.channelId}`);
  }

  // Change lang command
  if (message.content.startsWith("!setup lang")) {
    const langCommands = {
      [languageSeter("command").command_lang_fr]: {
        lang: "fr_FR",
        response: languageSeter("command").text_lang_fr,
      },
      [languageSeter("command").command_lang_en]: {
        lang: "en_EN",
        response: languageSeter("command").text_lang_en,
      },
      [languageSeter("command").command_lang_es]: {
        lang: "es_ES",
        response: languageSeter("command").text_lang_es,
      },
    };

    const langOption = langCommands[message.content.toLowerCase()];

    if (langOption) {
      languageChanger(message.guildId, langOption.lang);
      message.channel.send(langOption.response);
    } else {
      languageChanger(message.guildId, "en_EN");
      message.channel.send(`${languageSeter("command").text_lang_error}`);
    }
  }

  // Deleted invalid url or invalid command
  if (
    textChecker(
      message.content,
      languageSeter(langServerData?.lang || "en_EN")
    ) == false &&
    message.channelId == checkerInput?.input
  ) {
    message.delete(message.id);
    console.log(
      `\x1b[41m\x1b[1mBOT:\x1b[0m This message has been deleted: \x1b[1m\x1b[33m${message.content}\x1b[0m`
    );
  }
});
