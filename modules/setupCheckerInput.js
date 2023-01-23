const Setup = require("../model/setup.js");

const setupCheckerInput = (channelId) => {
  return Setup.findOne({ input: channelId }).exec();
};

module.exports = setupCheckerInput;
