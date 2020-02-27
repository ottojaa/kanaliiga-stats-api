var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var MatchSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    isbn: { type: String, required: true },
    user: { type: Schema.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", MatchSchema);
