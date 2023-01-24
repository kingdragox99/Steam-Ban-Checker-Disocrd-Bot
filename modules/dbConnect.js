const mongoose = require("mongoose");
require("dotenv").config();

const dbConnect = () => {
  mongoose.set("strictQuery", false);

  mongoose.connect(process.env.MONGO_URL, (err) => {
    if (err) console.log(err);
    else
      console.log(
        "\x1b[41m\x1b[1mPTS BOT:\x1b[0m \x1b[1m\x1b[32mMongoDB\x1b[0m is connected"
      );
  });
};

module.exports = dbConnect;
