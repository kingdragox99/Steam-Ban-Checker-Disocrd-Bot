// Check if the input string is include in command array
function textChecker(string, data) {
  let checker = false;
  Object.values(data).forEach(function (data) {
    if (string.includes(data) == true) {
      checker = true;
    }
  });
  // Return true or false
  return checker;
}

module.exports = textChecker;
