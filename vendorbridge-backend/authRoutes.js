const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authController = require("./authController");
const authenticateToken = require("./authMiddleware");
const authorizeRoles = require("./middleware/roleMiddleware");

const router = express.Router();

require("dotenv").config();

const JWT_SECRET =
  process.env.JWT_SECRET || "super_secret_vendorbridge_key_123!";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      console.error("Google Auth Error:", err);
      return res.redirect(`${FRONTEND_URL}/login?error=GoogleAuthFailed`);
    }
    if (!user) {
      if (info && info.message === "UserNotRegistered") {
        return res.redirect(`${FRONTEND_URL}/login?error=UserNotRegistered`);
      }
      return res.redirect(`${FRONTEND_URL}/login?error=GoogleAuthFailed`);
    }

    try {
      const roleName = user.role_name || "Vendor";

      const tokenPayload = {
        id: user.user_id,
        email: user.email,
        role: roleName,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      const fullNameEncoded = encodeURIComponent(user.full_name || "");
      const roleEncoded = encodeURIComponent(roleName);
      const isVerifiedEncoded = encodeURIComponent(user.is_verified || false);
      const statusEncoded = encodeURIComponent(user.status || "");

      return res.redirect(
        `${FRONTEND_URL}/login?token=${token}&role=${roleEncoded}&fullName=${fullNameEncoded}&isVerified=${isVerifiedEncoded}&status=${statusEncoded}`,
      );
    } catch (tokenErr) {
      console.error("Google Auth Token Generation Error:", tokenErr);
      return res.redirect(`${FRONTEND_URL}/login?error=TokenGenerationError`);
    }
  })(req, res, next);
});

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/profile", authenticateToken, authController.profile);
router.put(
  "/approve-vendor/:id",
  authenticateToken,
  authorizeRoles("Admin", "Procurement Officer", "Manager"),
  authController.approveVendor,
);
router.post("/logout", authController.logout);

module.exports = router;
