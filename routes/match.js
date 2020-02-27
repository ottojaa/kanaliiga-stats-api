const express = require("express");
const MatchController = require("../controllers/MatchController");

const router = express.Router();

router.get("/", MatchController.matchList);
router.get("/:id", MatchController.matchDetail);
router.post("/", MatchController.matchStore);
router.put("/:id", MatchController.matchUpdate);
router.delete("/:id", MatchController.matchDelete);

module.exports = router;
