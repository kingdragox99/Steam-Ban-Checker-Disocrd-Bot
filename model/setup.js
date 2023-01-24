const mongoose = require("mongoose");

const setupSchema = new mongoose.Schema({
  idserver: String,
  input: String,
  output: String,
});

const Setup = mongoose.model("Setup", setupSchema);

module.exports = Setup;
