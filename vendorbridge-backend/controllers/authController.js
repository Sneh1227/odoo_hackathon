const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../db");
const { sendResetEmail, sendWelcomeEmail, sendVendorApprovalEmail } = require("../config/mailer");

require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_vendorbridge_key_123!";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Password strength validator helper
const isStrongPassword = (pwd) => {
  const minLength = pwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  return minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
};

// 1. POST /api/auth/register
const register = async (req, res) => {
  const { fullName, email, password, confirmPassword, role } = req.body;

  try {
    // Basic presence validation
    if (!fullName || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Email format validation
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Role check - only Vendor and Procurement Officer allowed during signup
    const allowedRoles = ["Vendor", "Procurement Officer"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Only 'Vendor' and 'Procurement Officer' roles are permitted during public signup.",
      });
    }

    // Password strength validation
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    // Confirm password matching
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Check duplicate email
    const userExists = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "An account with this email address already exists." });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Save user
    const newUser = await db.query(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role, created_at",
      [fullName, email, passwordHash, role]
    );

    // Send welcome email asynchronously
    sendWelcomeEmail(newUser.rows[0].email, newUser.rows[0].full_name)
      .catch((emailErr) => {
        console.error(`[Welcome Email Error] Failed to send welcome email to ${newUser.rows[0].email}:`, emailErr.message);
      });

    return res.status(201).json({
      message: "Registration successful. You can now log in.",
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "An error occurred while creating your account." });
  }
};

// 2. POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Fetch user
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = result.rows[0];

    // Check if user is a Google-only user with no password
    if (!user.password_hash) {
      return res.status(400).json({
        message: "This account was registered using Google. Please log in with Google.",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Sign JWT Token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Respond with token, user info, role
    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        profilePicture: user.profile_picture,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "An error occurred during login." });
  }
};

// 3. POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const result = await db.query("SELECT id, full_name, email FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      // For security, don't reveal that the user does not exist.
      // Simply return success but do nothing.
      return res.json({
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    const user = result.rows[0];

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1 hour validity

    // Save token & expiry to DB
    await db.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2, updated_at = NOW() WHERE id = $3",
      [token, expiry, user.id]
    );

    // Reset Link
    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    // Dispatch email
    await sendResetEmail(user.email, user.full_name, resetLink, "1 hour");

    return res.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "An error occurred while handling your forgot password request." });
  }
};

// 4. POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  try {
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: "Token, password, and confirm password are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    // Verify token & expiry in DB
    const result = await db.query(
      "SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    const userId = result.rows[0].id;

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await db.query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW() WHERE id = $2",
      [passwordHash, userId]
    );

    return res.json({ message: "Your password has been successfully reset. You can now log in." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "An error occurred while resetting your password." });
  }
};

// 5. GET /api/auth/profile
const profile = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const result = await db.query(
      "SELECT id, full_name, email, role, google_id, profile_picture, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Profile Error:", error);
    return res.status(500).json({ message: "An error occurred while retrieving your profile." });
  }
};

// 6. POST /api/auth/logout
};

// 7. PUT /api/auth/approve-vendor/:id
const approveVendor = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Fetch user to verify role
    const userResult = await db.query("SELECT id, full_name, email, role, is_verified FROM users WHERE id = $1", [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = userResult.rows[0];

    if (user.role !== "Vendor") {
      return res.status(400).json({ message: "Only users with the 'Vendor' role can be approved." });
    }

    if (user.is_verified) {
      return res.status(200).json({
        message: "Vendor account is already approved.",
        user,
      });
    }

    // Update DB
    const updateResult = await db.query(
      "UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = $1 RETURNING id, full_name, email, role, is_verified, created_at, updated_at",
      [id]
    );
    const updatedUser = updateResult.rows[0];

    // Dispatch approval email
    sendVendorApprovalEmail(updatedUser.email, updatedUser.full_name)
      .catch((emailErr) => {
        console.error(`[Vendor Approval Email Error] Failed to send email to ${updatedUser.email}:`, emailErr.message);
      });

    return res.json({
      message: "Vendor account approved successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Approve Vendor Error:", error);
    return res.status(500).json({ message: "An error occurred while approving the vendor account." });
  }
};

// 6. POST /api/auth/logout
const logout = async (req, res) => {
  // Stateless JWT doesn't strictly need a backend logout trigger,
  // but we provide it for client compatibility.
  return res.json({ message: "Logout successful." });
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  profile,
  approveVendor,
  logout,
};
