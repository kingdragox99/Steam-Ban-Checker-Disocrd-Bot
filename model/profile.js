const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  ID_server: String,
  watcher_user: String,
  url: String,
  watch_user: String,
  ban: Boolean,
});

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;
