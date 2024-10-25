const { createClient } = require("@supabase/supabase-js");
const client = require("../modules/initBot.js");
const scapBan = require("../modules/scapBan.js");
const languageSeter = require("../modules/languageSeter.js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const fetchBans = async (from = 0, limit = 1000) => {
  const { data: bans, error } = await supabase
    .from("profil")
    .select("*")
    .eq("ban", false)
    .range(from, from + limit - 1);

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
  }
};

const notifyChannels = async (channels, message) => {
  await Promise.all(
    channels.map((channel) => {
      const channelInstance = client.channels.cache.get(channel.output);
      if (channelInstance) {
        return channelInstance.send({
          content: message,
        });
      } else {
        console.error(`Error: Channel with ID ${channel.output} not found.`);
      }
    })
  );
};

const checkForBan = async () => {
  console.log("\x1b[41m\x1b[1mBOT:\x1b[0m Checking for new bans...");
  let from = 0;
  const limit = 1000;
  let bans;
  const channels = await fetchChannels();

  if (!channels || channels.length === 0) {
    console.error("Error: No channels found. Exiting ban check.");
    return;
  }

  do {
    bans = await fetchBans(from, limit);

    await Promise.all(
      bans.map(async (data) => {
        try {
          if (await scapBan(data.url)) {
            console.log(
              `\x1b[41m\x1b[1mBOT:\x1b[0m A cheater was detected: \x1b[1m\x1b[32m${data.url}[0m`
            );

            const message =
              languageSeter(channels[0]?.lang || "en_EN").response_ban +
              ` ${data.url}`;
            await notifyChannels(channels, message);
            await updateBanStatus(data.url);
          }
        } catch (error) {
          console.error(
            `Error processing ban for URL ${data.url}:`,
            error.message
          );
        }
      })
    );

    from += limit;
  } while (bans && bans.length > 0);
};

module.exports = checkForBan;
