var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: "USER" },
    isConfirmed: { type: Boolean, required: true, default: 0 },
    confirmOTP: { type: String, required: false },
    otpTries: { type: Number, required: false, default: 0 },
    status: { type: Boolean, required: true, default: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
