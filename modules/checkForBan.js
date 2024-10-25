const axios = require("axios");
const cheerio = require("cheerio");
const { createClient } = require("@supabase/supabase-js");
const client = require("../modules/initBot.js");
const scapBan = require("../modules/scapBan.js"); // Renvoie true or false si le profil est banni ou non
const languageSeter = require("../modules/languageSeter.js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const fetchBans = async (from = 0, to = 999) => {
  console.log(`[DEBUG] Fetching bans from ${from} to ${to}`);
  const { data: bans, error } = await supabase
    .from("profil")
    .select("*")
    .eq("ban", false)
    .range(from, to);

  if (error) {
    console.error("Error fetching bans:", error.message);
  } else {
    console.log(`[DEBUG] Fetched ${bans.length} bans from the database.`);
  }

  return bans;
};

const fetchChannels = async () => {
  console.log("[DEBUG] Fetching channels from the database...");
  const { data: channels, error } = await supabase
    .from("discord")
    .select("*")
    .gt("output", 1);

  if (error) {
    console.error("Error fetching channels:", error.message);
  } else {
    console.log(
      `[DEBUG] Fetched ${channels.length} channels from the database.`
    );
  }

  return channels;
};

const updateBanStatus = async (url) => {
  console.log(`[DEBUG] Updating ban status for URL: ${url}`);
  const currentDate = new Date()
    .toISOString()
    .replace("T", " ")
    .replace("Z", "");
  const { error } = await supabase
    .from("profil")
    .update({ ban: true, ban_date: currentDate })
    .eq("url", url);

  if (error) {
    console.error(`Error updating ban status for ${url}:`, error.message);
  } else {
    console.log(`[DEBUG] Successfully updated ban status for ${url}.`);
  }
};

const notifyChannels = async (channels, message) => {
  console.log("[DEBUG] Notifying channels...");
  await Promise.all(
    channels.map((channel) => {
      console.log(`[DEBUG] Sending message to channel ID: ${channel.output}`);
      return client.channels.cache.get(channel.output).send({
        content: message,
      });
    })
  );
  console.log("[DEBUG] All channels have been notified.");
};

const checkForBan = async () => {
  console.log("[BOT] Checking for new bans...");
  let from = 0;
  let to = 999;
  let bans;
  const channels = await fetchChannels();

  if (!channels) {
    console.log("[DEBUG] No channels found, exiting...");
    return; // Sortie si aucune donnée
  }

  do {
    bans = await fetchBans(from, to);
    if (!bans || bans.length === 0) {
      console.log("[DEBUG] No more bans to process, exiting...");
      break;
    }

    await Promise.all(
      bans.map(async (data) => {
        console.log(`[DEBUG] Checking ban status for URL: ${data.url}`);
        if (await scapBan(data.url)) {
          console.log(`[BOT] A ban was detected: ${data.url}`);

          const message =
            languageSeter(channels[0]?.lang || "en_EN").response_ban +
            ` ${data.url}`;
          console.log(
            `[DEBUG] Notifying channels about ban for URL: ${data.url}`
          );
          await notifyChannels(channels, message);
          await updateBanStatus(data.url);
        } else {
          console.log(`[DEBUG] No ban detected for URL: ${data.url}`);
        }
      })
    );

    from += 1000;
    to += 1000;
  } while (bans && bans.length > 0);
};

module.exports = checkForBan;
