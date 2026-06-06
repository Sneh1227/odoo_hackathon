const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("./db");

require("dotenv").config();

// Role mapping helper
const roleIdMap = {
  1: "Admin",
  2: "Vendor",
  3: "Procurement Officer",
  4: "Manager"
};

passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query("SELECT * FROM tbl_users WHERE user_id = $1", [id]);
    if (result.rows.length > 0) {
      done(null, result.rows[0]);
    } else {
      done(new Error("User not found"), null);
    }
  } catch (error) {
    done(error, null);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          const googleId = profile.id;

          if (!email) {
            return done(new Error("No email found in Google profile"), null);
          }

          // Check if user already exists by google_id
          let res = await db.query("SELECT * FROM tbl_users WHERE google_id = $1", [googleId]);
          if (res.rows.length > 0) {
            return done(null, res.rows[0]);
          }

          // Check if user already exists by email
          res = await db.query("SELECT * FROM tbl_users WHERE email = $1", [email]);
          if (res.rows.length > 0) {
            // Update user to link Google ID
            const updatedUser = await db.query(
              "UPDATE tbl_users SET google_id = $1 WHERE email = $2 RETURNING *",
              [googleId, email]
            );
            return done(null, updatedUser.rows[0]);
          }

          // User does not exist (not registered!). Fail authentication and don't auto-register.
          return done(null, false, { message: "UserNotRegistered" });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn("Google Client ID and Client Secret not specified. Google login disabled.");
}

module.exports = passport;
