const Profile = require("../model/profile.js");
const Server = require("../model/server.js");
const client = require("../modules/initBot.js");
const scapBan = require("../modules/scapBan.js");
const languageSeter = require("../modules/languageSeter.js");

const checkForBan = async () => {
  const ban = await Profile.find({ ban: false }).exec(); // Get all users with ban = false
  const channels = await Server.find({ output: { $gt: 1 } }).exec(); // Get all output

  console.log(`\x1b[41m\x1b[1mBOT:\x1b[0m Check for new bans\x1b[0m`);

  // For each user with "ban = false" does this:
  ban.forEach(async (data) => {
    // If after check scapBan return true, do this:
    if ((await scapBan(data.url)) == true) {
      // Loop in all channels of output
      for (let i = 0; i < channels.length; i++) {
        const urlStatusChange = { url: data.url };
        const banStatusChange = { ban: true };

        console.log(
          `\x1b[41m\x1b[1mBOT:\x1b[0m A slut was detected \x1b[45m\x1b[1m\x1b[31m${data.url}\x1b[0m`
        );
        // Send message in all channels !setup output
        client.channels.cache.get(channels[i].output).send({
          content: `${
            languageSeter(channels[i]?.lang || "en_EN").response_ban
          } ${data.url}`,
        });
        // Update ban status for false to true
        let update = await Profile.findOneAndUpdate(
          urlStatusChange,
          banStatusChange,
          {
            new: true,
          }
        );
      }
    }
  });
};

module.exports = checkForBan;
