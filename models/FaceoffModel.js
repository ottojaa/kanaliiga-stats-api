var mongoose = require("mongoose");

var Participant = new mongoose.Schema({
  id: String,
  name: String
});

var ParticipantSchema = new mongoose.Schema({
  number: Number,
  position: Number,
  participant: [Participant],
  rank: Number,
  result: String,
  forfeit: String,
  score: Number
});

var PlayerSchema = new mongoose.Schema({
  team: { type: Number, required: true },
  name: { type: String, required: true },
  score: { type: Number, required: true },
  goals: { type: Number, required: true },
  assists: { type: Number, required: true },
  shots: { type: Number, required: true },
  saves: { type: Number, required: true },
  teamName: { type: String, required: true },
  count: { type: Number, required: false },
  shootingPercentage: { type: Number, required: false }
});

var TeamSchema = new mongoose.Schema({
  score: { type: Number, required: true },
  teamId: { type: Number, required: true },
  name: { type: String, required: true },
  result: { type: String, required: true },
  players: [PlayerSchema]
});

var MatchSchema = new mongoose.Schema({
  date: { type: String, required: true },
  matchIndex: { type: Number, required: true },
  teams: [TeamSchema]
});

var FaceoffSchema = new mongoose.Schema(
  {
    creator: String,
    matchId: { type: String, required: true },
    stageId: { type: String, required: true },
    date: { type: String, required: true },
    participants: [ParticipantSchema],
    matches: [MatchSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Faceoff", FaceoffSchema);
