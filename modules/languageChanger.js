const Server = require("../model/server.js");

function setupChanger(guild, lang) {
  const guildId = { ID_server: guild };
  const langName = { lang: lang };

  // Merge 2 objects for createnew server
  const createBot = { ID_server: guild, lang: lang };

  // Check if the discord server is already on the DB
  Server.exists({ ID_server: guild }).then(async (exists) => {
    if (exists) {
      //If there is an update
      let update = await Server.findOneAndUpdate(guildId, langName, {
        new: true,
      });
      console.log(
        `\x1b[41m\x1b[1mBOT:\x1b[0m GuildId:\x1b[33m\x1b[1m ${guild} \x1b[0mhave update lang to ${lang}`
      );
    } else {
      //Else, create one
      const newServer = await Server.create(createBot);
      console.log(
        `\x1b[41m\x1b[1mBOT:\x1b[0m GuildId:\x1b[33m\x1b[1m ${guild} \x1b[0mhave make ${lang} channel`
      );
    }
  });
}

module.exports = setupChanger;
