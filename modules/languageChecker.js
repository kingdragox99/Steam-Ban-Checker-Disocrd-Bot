const Server = require("../model/server.js");

const langChecker = (guildId) => {
  return Server.findOne({ ID_server: guildId }).exec();
};

module.exports = langChecker;
