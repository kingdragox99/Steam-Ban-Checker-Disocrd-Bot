const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  url: String,
  ban: Boolean,
  slut: String,
  user: String,
});

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;
