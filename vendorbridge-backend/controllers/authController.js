const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../db");
const { sendResetEmail, sendWelcomeEmail, sendVendorApprovalEmail } = require("../config/mailer");

require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_vendorbridge_key_123!";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Role mapping helper constants
const roleMap = {
  "Admin": 1,
  "Vendor": 2,
  "Procurement Officer": 3,
  "Manager": 4
};

const roleIdMap = {
  1: "Admin",
  2: "Vendor",
  3: "Procurement Officer",
  4: "Manager"
};

const isStrongPassword = (pwd) => {
  const minLength = pwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  return minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
};

const register = async (req, res) => {
  const { fullName, email, password, confirmPassword, role } = req.body;

  try {
    if (!fullName || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const allowedRoles = ["Vendor", "Procurement Officer"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Only 'Vendor' and 'Procurement Officer' roles are permitted during public signup.",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const userExists = await db.query("SELECT user_id FROM tbl_users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "An account with this email address already exists." });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Ensure role exists in tbl_roles and get its id. If missing, create it.
    const getRoleResult = await db.query("SELECT role_id FROM tbl_roles WHERE role_name = $1", [role]);
    let roleId;
    if (getRoleResult.rows.length > 0) {
      roleId = getRoleResult.rows[0].role_id;
    } else {
      const insertRole = await db.query(
        "INSERT INTO tbl_roles (role_name) VALUES ($1) RETURNING role_id",
        [role]
      );
      roleId = insertRole.rows[0].role_id;
    }

    const newUser = await db.query(
      "INSERT INTO tbl_users (full_name, email, password, role_id) VALUES ($1, $2, $3, $4) RETURNING user_id, full_name, email, role_id, created_at",
      [fullName, email, passwordHash, roleId]
    );

    const registeredUser = {
      id: newUser.rows[0].user_id,
      fullName: newUser.rows[0].full_name,
      email: newUser.rows[0].email,
      role: roleIdMap[newUser.rows[0].role_id] || "Vendor",
      created_at: newUser.rows[0].created_at,
    };

    // Send welcome email asynchronously
    sendWelcomeEmail(registeredUser.email, registeredUser.fullName)
      .catch((emailErr) => {
        console.error(`[Welcome Email Error] Failed to send welcome email to ${registeredUser.email}:`, emailErr.message);
      });

    return res.status(201).json({
      message: "Registration successful. You can now log in.",
      user: registeredUser,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "An error occurred while creating your account." });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const result = await db.query("SELECT * FROM tbl_users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = result.rows[0];

    if (!user.password) {
      return res.status(400).json({
        message: "This account was registered using Google. Please log in with Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const roleName = roleIdMap[user.role_id] || "Vendor";

    const tokenPayload = {
      id: user.user_id,
      email: user.email,
      role: roleName,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: roleName,
        profilePicture: user.profile_picture,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "An error occurred during login." });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const result = await db.query("SELECT user_id, full_name, email FROM tbl_users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.json({
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    const user = result.rows[0];

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    await db.query(
      "UPDATE tbl_users SET reset_token = $1, reset_token_expiry = $2 WHERE user_id = $3",
      [token, expiry, user.user_id]
    );

    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    await sendResetEmail(user.email, user.full_name, resetLink, "1 hour");

    return res.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "An error occurred while handling your forgot password request." });
  }
};

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

    const result = await db.query(
      "SELECT user_id FROM tbl_users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    const userId = result.rows[0].user_id;

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await db.query(
      "UPDATE tbl_users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $2",
      [passwordHash, userId]
    );

    return res.json({ message: "Your password has been successfully reset. You can now log in." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "An error occurred while resetting your password." });
  }
};

const profile = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT user_id, full_name, email, role_id, google_id, profile_picture, created_at FROM tbl_users WHERE user_id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = result.rows[0];
    const roleName = roleIdMap[user.role_id] || "Vendor";

    const userForResponse = {
      id: user.user_id,
      fullName: user.full_name,
      email: user.email,
      role: roleName,
      googleId: user.google_id,
      profilePicture: user.profile_picture,
      created_at: user.created_at
    };

    return res.json({ user: userForResponse });
  } catch (error) {
    console.error("Profile Error:", error);
    return res.status(500).json({ message: "An error occurred while retrieving your profile." });
  }
};

const approveVendor = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const userResult = await db.query("SELECT user_id, full_name, email, role_id, is_verified FROM tbl_users WHERE user_id = $1", [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = userResult.rows[0];
    const roleName = roleIdMap[user.role_id] || "Vendor";

    if (roleName !== "Vendor") {
      return res.status(400).json({ message: "Only users with the 'Vendor' role can be approved." });
    }

    if (user.is_verified) {
      return res.status(200).json({
        message: "Vendor account is already approved.",
        user: {
          id: user.user_id,
          fullName: user.full_name,
          email: user.email,
          role: roleName,
          is_verified: user.is_verified
        },
      });
    }

    const updateResult = await db.query(
      "UPDATE tbl_users SET is_verified = true WHERE user_id = $1 RETURNING user_id, full_name, email, role_id, is_verified, created_at",
      [id]
    );
    const updatedUser = updateResult.rows[0];

    const updatedUserForResponse = {
      id: updatedUser.user_id,
      fullName: updatedUser.full_name,
      email: updatedUser.email,
      role: roleIdMap[updatedUser.role_id],
      is_verified: updatedUser.is_verified,
      created_at: updatedUser.created_at
    };

    sendVendorApprovalEmail(updatedUserForResponse.email, updatedUserForResponse.fullName)
      .catch((emailErr) => {
        console.error(`[Vendor Approval Email Error] Failed to send email to ${updatedUserForResponse.email}:`, emailErr.message);
      });

    return res.json({
      message: "Vendor account approved successfully.",
      user: updatedUserForResponse,
    });
  } catch (error) {
    console.error("Approve Vendor Error:", error);
    return res.status(500).json({ message: "An error occurred while approving the vendor account." });
  }
};

const logout = async (req, res) => {
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
