var mongoose = require("mongoose");

var ReplaySchema = new mongoose.Schema({
  file: [Buffer]
});

module.exports = mongoose.model("Replay", ReplaySchema);
