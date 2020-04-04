const express = require("express");
const UserController = require("../controllers/UserController");

const router = express.Router();

router.get("/all-users", UserController.findUsers);
router.put("/update-user-role", UserController.updateUserRole);

module.exports = router;
