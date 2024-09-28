const dbConnect = require("./modules/dbConnect.js");
const client = require("./modules/initBot.js");
const setupCheckerInput = require("./modules/setupCheckerInput.js");
const scheduleStart = require("./modules/schedule.js");
const scapBan = require("./modules/scapBan.js");
const scapName = require("./modules/scapName.js");
const Profile = require("./model/profile.js");
const textChecker = require("./modules/textChecker.js");
const setupBot = require("./modules/setupBot.js");
const languageChanger = require("./modules/languageChanger.js");
const languageChecker = require("./modules/languageChecker.js");
const languageSeter = require("./modules/languageSeter.js");

console.log(
  "\x1b[41m\x1b[1mBOT:\x1b[0m This \x1b[31m\x1b[1mBOT\x1b[0m was made with Love by \x1b[41m\x1b[1mDragolelele\x1b[0m"
);

dbConnect(); // connect to DB
scheduleStart(); // Start daily task

////////////////////////////////////WIP SUPABASE//////////////////////////////////////////////////////////////////
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = "https://thsdyclkzguvethyngrm.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const test = async () => {
  const { data, error } = await supabase.from("discord").insert({
    id_server: "16554545",
    input: "165655654545",
    output: "165564544545",
    lang: "en_EN",
  });
  if (error) {
    console.log(error);
  } else {
    console.log(
      "\x1b[41m\x1b[1mBOT:\x1b[0m \x1b[1m\x1b[32mSupabase\x1b[0m is connected"
    );
  }
};

test();
////////////////////////////////////WIP SUPABASE//////////////////////////////////////////////////////////////////

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
    // Push a new user in DB
    const newSurveil = await Profile.create({
      ID_server: message.guildId,
      watcher_user: message.author.username,
      url: message.content,
      watch_user: await scapName(message.content),
      ban: await scapBan(message.content),
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
    switch (message.content.toLowerCase()) {
      case `${languageSeter("command").command_lang_fr}`: // Command bot French
        languageChanger(message.guildId, "fr_FR");
        message.channel.send(`${languageSeter("command").text_lang_fr}`);
        break;
      case `${languageSeter("command").command_lang_en}`: // Command bot English
        languageChanger(message.guildId, "en_EN");
        message.channel.send(`${languageSeter("command").text_lang_en}`);
        break;
      case `${languageSeter("command").command_lang_es}`: // Command bot Spanish
        languageChanger(message.guildId, "es_ES");
        message.channel.send(`${languageSeter("command").text_lang_es}`);
        break;
      default:
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
