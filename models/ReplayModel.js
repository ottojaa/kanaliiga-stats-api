var mongoose = require("mongoose");

var ReplaySchema = new mongoose.Schema({
  files: {
    file: [Buffer],
    matchId: String,
  },
});

module.exports = mongoose.model("Replay", ReplaySchema);
