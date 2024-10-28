const { createClient } = require("@supabase/supabase-js");
const client = require("../modules/initBot.js");
const scapBan = require("../modules/scapBan.js");
const languageSeter = require("../modules/languageSeter.js");
const Bottleneck = require("bottleneck");
const pino = require("pino");
require("dotenv").config();

const logger = pino({
  level: process.env.LOG_LEVEL || "debug",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const fetchBans = async (from = 0, limit = 1000, retries = 3) => {
  logger.debug(`Fetching bans from ${from} to ${from + limit - 1}`);
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data: bans, error } = await supabase
        .from("profil")
        .select("*")
        .eq("ban", false)
        .range(from, from + limit - 1);

      if (error) {
        throw error;
      }

      logger.debug(`Successfully fetched ${bans.length} bans.`);
      return bans || []; // Ensure bans is always an array
    } catch (error) {
      logger.error(`Error fetching bans (attempt ${attempt}):`, error.message);
      if (attempt === retries) {
        logger.error("Max retries reached. Returning an empty array.");
        return []; // Return an empty array to avoid null issues
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
};

const fetchChannels = async () => {
  logger.debug("Fetching channels from the database...");
  const { data: channels, error } = await supabase
    .from("discord")
    .select("*")
    .gt("output", 1);

  if (error) {
    logger.error("Error fetching channels:", error.message);
  }

  if (channels) {
    logger.debug(`Successfully fetched ${channels.length} channels.`);
  } else {
    logger.debug("No channels found.");
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
    logger.error(`Error updating ban status for ${url}:`, error.message);
    return false;
  } else {
    logger.debug(`Successfully updated ban status for ${url}`);
    return true;
  }
};

const notifyChannels = async (channels, message) => {
  logger.debug("Notifying channels...");
  await Promise.all(
    channels.map((channel) => {
      const channelInstance = client.channels.cache.get(channel.output);
      if (channelInstance) {
        logger.debug(`Sending message to channel ID: ${channel.output}`);
        return channelInstance.send({
          content: message,
        });
      } else {
        logger.error(`Error: Channel with ID ${channel.output} not found.`);
      }
    })
  );
  logger.debug("All channels have been notified.");
};

const checkForBan = async () => {
  logger.info("BOT: Checking for new bans...");
  let from = 0;
  const limit = 1000;
  let bans;
  const channels = await fetchChannels();

  if (!channels || channels.length === 0) {
    logger.error("Error: No channels found. Exiting ban check.");
    return;
  }

  // Initialiser Bottleneck pour limiter le nombre de requêtes concurrentes
  const limiter = new Bottleneck({
    maxConcurrent: 10,
    minTime: 100, // 100 ms entre chaque requête pour éviter le rate limit
  });

  do {
    logger.debug(`Fetching bans starting from index ${from}`);
    bans = await fetchBans(from, limit);

    if (!bans || bans.length === 0) {
      logger.debug("No more bans to process, exiting...");
      break;
    }

    logger.debug(`Processing ${bans.length} bans...`);
    await Promise.all(
      bans.map((data) =>
        limiter.schedule(async () => {
          try {
            if (await scapBan(data.url)) {
              logger.info(`BOT: A ban was detected: ${data.url}`);

              const message =
                languageSeter(channels[0]?.lang || "en_EN").response_ban +
                ` ${data.url}`;
              logger.debug(`Notifying channels about ban for URL: ${data.url}`);
              await notifyChannels(channels, message);
              const success = await updateBanStatus(data.url);
              if (!success) {
                logger.error(
                  `Failed to update ban status for URL: ${data.url}`
                );
              }
            }
          } catch (error) {
            logger.error(
              `Error processing ban for URL ${data.url}:`,
              error.message
            );
          }
        })
      )
    );

    from += limit;
  } while (bans && bans.length > 0);
};

module.exports = checkForBan;
