const express = require("express");
const FaceoffController = require("../controllers/FaceoffController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.get("/", FaceoffController.faceoffList);
router.get("/player-stats", FaceoffController.faceoffPlayerStats);
router.get("/team-stats", FaceoffController.stageTeamStats);
router.get("/stage-matches", FaceoffController.faceoffsForStage);
router.get("/replays", FaceoffController.getReplaysForMatch);
router.get("/:id", FaceoffController.faceoffDetail);
router.post("/", FaceoffController.faceoffStore);
router.post("/replays/:id", FaceoffController.faceoffReplayUpload);
router.post("/parse", upload.single("file"), FaceoffController.replayParser);
router.post("/parse/v2/", FaceoffController.replayParserV2);
router.put("/:id", FaceoffController.faceoffUpdate);
router.delete("/:id", FaceoffController.faceoffDelete);

module.exports = router;
