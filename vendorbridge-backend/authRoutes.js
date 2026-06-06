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
  (req, res, next) => {
    const fromPort = req.query.from_port || "";
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      state: fromPort,
    })(req, res, next);
  }
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    const state = req.query.state || "";
    const targetFrontendUrl = state && /^\d+$/.test(state)
      ? `http://localhost:${state}`
      : FRONTEND_URL;

    if (err) {
      console.error("Google Auth Error:", err);
      return res.redirect(`${targetFrontendUrl}/login?error=GoogleAuthFailed`);
    }
    if (!user) {
      if (info && info.message === "UserNotRegistered") {
        return res.redirect(`${targetFrontendUrl}/login?error=UserNotRegistered`);
      }
      return res.redirect(`${targetFrontendUrl}/login?error=GoogleAuthFailed`);
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

      return res.redirect(
        `${targetFrontendUrl}/login?token=${token}&role=${roleEncoded}&fullName=${fullNameEncoded}`,
      );
    } catch (tokenErr) {
      console.error("Google Auth Token Generation Error:", tokenErr);
      return res.redirect(`${targetFrontendUrl}/login?error=TokenGenerationError`);
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
