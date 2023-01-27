const Server = require("../model/server.js");

function setupBot(guild, channel, way) {
  const guildId = { ID_server: guild };

  // Return object by par way
  const channelId = (e) => {
    if (e == "input") {
      return { input: channel };
    } else {
      return { output: channel };
    }
  };

  // Merge 2 objects for createnew server
  const createBot = { ID_server: guild, lang: "en_EN", ...channelId(way) };

  // Check if the discord server is already on the DB
  Server.exists({ ID_server: guild }).then(async (exists) => {
    if (exists) {
      //If there is an update
      let update = await Server.findOneAndUpdate(guildId, channelId(way), {
        new: true,
      });
      console.log(
        `\x1b[41m\x1b[1mBOT:\x1b[0m GuildId:\x1b[33m\x1b[1m ${guild} \x1b[0mhave update ${way} channel`
      );
    } else {
      //Else, create one
      const newServer = await Server.create(createBot);
      console.log(
        `\x1b[41m\x1b[1mBOT:\x1b[0m GuildId:\x1b[33m\x1b[1m ${guild} \x1b[0mhave make ${way} channel`
      );
    }
  });
}

module.exports = setupBot;
