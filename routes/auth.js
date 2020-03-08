const express = require("express");
const AuthController = require("../controllers/AuthController");

const router = express.Router();

router.get("/validate-email", AuthController.findExistingEmail);
router.get("/validate-username", AuthController.findExistingUser);
router.get("/discord-auth", AuthController.discordAuth);
router.get("/discord-callback", AuthController.discordCallback);
router.get("/discord-login", AuthController.discordLogin);
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/verify-otp", AuthController.verifyConfirm);
router.post("/resend-verify-otp", AuthController.resendConfirmOtp);

module.exports = router;
