const express = require("express");
const FaceoffController = require("../controllers/FaceoffController");

const router = express.Router();

router.get("/", FaceoffController.faceoffList);
router.get("/:id", FaceoffController.faceoffDetail);
router.post("/", FaceoffController.faceoffStore);
router.put("/:id", FaceoffController.faceoffUpdate);
router.delete("/:id", FaceoffController.faceoffDelete);

module.exports = router;
