const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authController = require("./authController");
const authenticateToken = require("./authMiddleware");
const authorizeRoles = require("./middleware/roleMiddleware");

const router = express.Router();

require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_vendorbridge_key_123!";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login?error=GoogleAuthFailed`, session: false }),
  (req, res) => {
    try {
      const roleIdMap = {
        1: "Admin",
        2: "Vendor",
        3: "Procurement Officer",
        4: "Manager"
      };
      const roleName = roleIdMap[req.user.role_id] || "Vendor";

      const tokenPayload = {
        id: req.user.user_id,
        email: req.user.email,
        role: roleName,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      const fullNameEncoded = encodeURIComponent(req.user.full_name || "");
      const roleEncoded = encodeURIComponent(roleName);
      const profilePicEncoded = encodeURIComponent(req.user.profile_picture || "");

      return res.redirect(
        `${FRONTEND_URL}/login?token=${token}&role=${roleEncoded}&fullName=${fullNameEncoded}&profilePicture=${profilePicEncoded}`
      );
    } catch (err) {
      console.error("Google Auth Token Generation Error:", err);
      return res.redirect(`${FRONTEND_URL}/login?error=TokenGenerationError`);
    }
  }
);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/profile", authenticateToken, authController.profile);
router.put(
  "/approve-vendor/:id",
  authenticateToken,
  authorizeRoles("Admin", "Procurement Officer", "Manager"),
  authController.approveVendor
);
router.post("/logout", authController.logout);

module.exports = router;
