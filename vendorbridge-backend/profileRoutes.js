const express = require("express");
const authenticateToken = require("./authMiddleware");
const profileController = require("./profileController");

const router = express.Router();

router.get("/", authenticateToken, profileController.getProfile);
router.put("/", authenticateToken, profileController.updateProfile);
router.put("/change-password", authenticateToken, profileController.changePassword);

module.exports = router;
