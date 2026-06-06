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

const isAllowedFrontendOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

const resolveFrontendOrigin = (req) => {
  const fromQuery = req.query.origin;
  if (fromQuery && isAllowedFrontendOrigin(fromQuery)) {
    return fromQuery;
  }
  return FRONTEND_URL;
};

const encodeOAuthState = (origin) =>
  Buffer.from(JSON.stringify({ origin })).toString("base64url");

const decodeOAuthState = (state) => {
  if (!state) {
    return FRONTEND_URL;
  }
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    if (parsed.origin && isAllowedFrontendOrigin(parsed.origin)) {
      return parsed.origin;
    }
  } catch (error) {
    console.warn("[Google OAuth] Failed to decode state:", error.message);
  }
  return FRONTEND_URL;
};

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/google", (req, res, next) => {
  const origin = resolveFrontendOrigin(req);
  const state = encodeOAuthState(origin);
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state,
  })(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      const redirectOrigin = decodeOAuthState(req.query.state) || FRONTEND_URL;

      if (err) {
        console.error("Google Auth Error:", err);
        return res.redirect(`${redirectOrigin}/login?error=GoogleAuthFailed`);
      }
      if (!user) {
        if (info && info.message === "UserNotRegistered") {
          return res.redirect(`${redirectOrigin}/login?error=UserNotRegistered`);
        }
        return res.redirect(`${redirectOrigin}/login?error=GoogleAuthFailed`);
      }

      try {
        const roleName = user.role_name || "Vendor";

        const tokenPayload = {
          id: user.user_id,
          email: user.email,
          role: roleName,
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        const fullNameEncoded = encodeURIComponent(user.full_name || "");
        const roleEncoded = encodeURIComponent(roleName);
        const emailEncoded = encodeURIComponent(user.email || "");
        const idEncoded = encodeURIComponent(String(user.user_id || ""));
        const profilePictureEncoded = encodeURIComponent(user.profile_picture || "");
        const isVerifiedEncoded = encodeURIComponent(user.is_verified || false);
        const statusEncoded = encodeURIComponent(user.status || "");

        return res.redirect(
          `${redirectOrigin}/login?token=${token}&role=${roleEncoded}&fullName=${fullNameEncoded}&email=${emailEncoded}&id=${idEncoded}&profilePicture=${profilePictureEncoded}&isVerified=${isVerifiedEncoded}&status=${statusEncoded}`
        );
      } catch (tokenErr) {
        console.error("Google Auth Token Generation Error:", tokenErr);
        return res.redirect(`${redirectOrigin}/login?error=TokenGenerationError`);
      }
    })(req, res, next);
  }
);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/reset-password/:token", authController.resetPasswordByToken);
router.get("/profile", authenticateToken, authController.profile);
router.put(
  "/approve-vendor/:id",
  authenticateToken,
  authorizeRoles("Admin", "Procurement Officer", "Manager"),
  authController.approveVendor,
);
router.post("/logout", authController.logout);

module.exports = router;
