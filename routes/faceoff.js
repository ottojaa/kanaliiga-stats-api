const express = require("express");
const FaceoffController = require("../controllers/FaceoffController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.get("/", FaceoffController.faceoffList);
router.get("/player-stats", FaceoffController.faceoffPlayerStats);
router.get("/stage-matches", FaceoffController.faceoffsForStage);
router.get("/:id", FaceoffController.faceoffDetail);
router.post("/", FaceoffController.faceoffStore);
router.post("/parse", upload.single("file"), FaceoffController.replayParser);
router.put("/:id", FaceoffController.faceoffUpdate);
router.delete("/:id", FaceoffController.faceoffDelete);

module.exports = router;
