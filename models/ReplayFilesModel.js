var mongoose = require("mongoose");

var ReplayFilesSchema = new mongoose.Schema({
  files: [Buffer],
  matchId: String,
  tournamentId: String,
  date: String,
  matchName: String,
});

module.exports = mongoose.model("ReplayFiles", ReplayFilesSchema);
