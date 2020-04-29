const express = require("express");
const TeamsController = require("../controllers/TeamsController");

const router = express.Router();

router.get("/", TeamsController.findTeams);

module.exports = router;
