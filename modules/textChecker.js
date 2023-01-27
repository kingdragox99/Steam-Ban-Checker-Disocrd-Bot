const command = require("../modules/textArray.js");

// Check if the input string is include in command array
function textChecker(string) {
  let checker = false;
  command.forEach(function (data) {
    if (string.includes(data) == true) {
      checker = true;
    }
  });
  // Return true or false
  return checker;
}

module.exports = textChecker;
