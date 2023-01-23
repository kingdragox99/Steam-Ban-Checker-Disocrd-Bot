const Setup = require("../model/setup.js");

const setupCheckerOutput = (channelId) => {
  return Setup.findOne({ output: channelId }).exec();
};

module.exports = setupCheckerOutput;
