const express = require("express");
const FaceoffController = require("../controllers/FaceoffController");

const router = express.Router();

router.get("/", FaceoffController.matchList);
router.get("/:id", FaceoffController.matchDetail);
router.post("/", FaceoffController.matchStore);
router.put("/:id", FaceoffController.matchUpdate);
router.delete("/:id", FaceoffController.matchDelete);

module.exports = router;
