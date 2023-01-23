const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  url: String,
  ban: Boolean,
  user: String,
});

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;
