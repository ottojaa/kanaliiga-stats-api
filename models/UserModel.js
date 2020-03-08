var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema(
  {
    discordId: { type: String, require: false },
    username: { type: String, required: true },
    email: { type: String, required: false },
    password: { type: String, required: false },
    role: { type: String, required: true, default: "USER" },
    isConfirmed: { type: Boolean, required: false, default: 0 },
    confirmOTP: { type: String, required: false },
    otpTries: { type: Number, required: false, default: 0 },
    status: { type: Boolean, required: false, default: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
