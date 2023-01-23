const Setup = require("../model/setup.js");

async function setupChecker(e) {
  switch (e) {
    case "input":
      const input = await Setup.find();
      for (let i = 0; i < input.length; i++) {
        console.log(input[i].input);
      }
      break;
    case "output":
      const output = await Setup.find();
      for (let i = 0; i < output.length; i++) {
        console.log(output[i].output);
      }
      break;
    default:
      console.log("Nothing was ask");
  }
}

module.exports = setupChecker;
