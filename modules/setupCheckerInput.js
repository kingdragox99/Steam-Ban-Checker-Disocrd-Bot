const Server = require("../model/server.js");

const setupCheckerInput = (channelId) => {
  return Server.findOne({ input: channelId }).exec();
};

module.exports = setupCheckerInput;
