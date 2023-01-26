const command = require("../modules/textArray.js");

function textChecker(string) {
  let checker = false;
  command.forEach(function (data) {
    if (string.includes(data) == true) {
      checker = true;
    }
  });

  return checker;
}

module.exports = textChecker;
