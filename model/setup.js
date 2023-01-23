const mongoose = require("mongoose");

const setupSchema = new mongoose.Schema({
  idserver: Number,
  input: Number,
  output: Number,
});

const Setup = mongoose.model("Setup", setupSchema);

module.exports = Setup;
