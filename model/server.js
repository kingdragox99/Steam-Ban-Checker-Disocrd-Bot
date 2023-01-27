const mongoose = require("mongoose");

// TODO lang
const serverSchema = new mongoose.Schema({
  ID_server: String,
  input: String,
  output: String,
  lang: String,
});

const Server = mongoose.model("Server", serverSchema);

module.exports = Server;
