const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_vendorbridge_key_123!";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Manual registration
router.post("/register", authController.register);

// Manual login
router.post("/login", authController.login);

// Initiates Google login redirection
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// Google callback redirection
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login?error=GoogleAuthFailed`, session: false }),
  (req, res) => {
    // Generate JWT token on successful callback
    try {
      const tokenPayload = {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      // Redirect back to frontend login page with auth queries
      // Frontend will parse these parameters, store them, and redirect accordingly
      const fullNameEncoded = encodeURIComponent(req.user.full_name || "");
      const roleEncoded = encodeURIComponent(req.user.role || "Vendor");
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

// Forgot password request
router.post("/forgot-password", authController.forgotPassword);

// Reset password request
router.post("/reset-password", authController.resetPassword);

// Get authenticated user profile (Protected)
router.get("/profile", authenticateToken, authController.profile);

// Logout
router.post("/logout", authController.logout);

module.exports = router;
