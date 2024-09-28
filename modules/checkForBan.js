const { createClient } = require("@supabase/supabase-js");
const client = require("../modules/initBot.js");
const scapBan = require("../modules/scapBan.js");
const languageSeter = require("../modules/languageSeter.js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const fetchBans = async () => {
  const { data: bans, error } = await supabase
    .from("profil")
    .select("*")
    .eq("ban", false);

  if (error) {
    console.error("Error fetching bans:", error.message);
  }

  return bans;
};

const fetchChannels = async () => {
  const { data: channels, error } = await supabase
    .from("discord")
    .select("*")
    .gt("output", 1);

  if (error) {
    console.error("Error fetching channels:", error.message);
  }

  return channels;
};

const updateBanStatus = async (url) => {
  const { error } = await supabase
    .from("profil")
    .update({ ban: true })
    .eq("url", url);

  if (error) {
    console.error(`Error updating ban status for ${url}:`, error.message);
  }
};

const notifyChannels = async (channels, message) => {
  for (const channel of channels) {
    await client.channels.cache.get(channel.output).send({
      content: message,
    });
  }
};

const checkForBan = async () => {
  const bans = await fetchBans();
  const channels = await fetchChannels();

  console.log(`\x1b[41m\x1b[1mBOT:\x1b[0m Check for new bans\x1b[0m`);

  if (!bans || !channels) return; // Sortie si aucune donnée

  for (const data of bans) {
    if (await scapBan(data.url)) {
      console.log(
        `\x1b[41m\x1b[1mBOT:\x1b[0m A ban was detected \x1b[45m\x1b[1m\x1b[31m${data.url}\x1b[0m`
      );

      const message =
        languageSeter(channels[0]?.lang || "en_EN").response_ban +
        ` ${data.url}`;
      await notifyChannels(channels, message);
      await updateBanStatus(data.url);
    }
  }
};

module.exports = checkForBan;
