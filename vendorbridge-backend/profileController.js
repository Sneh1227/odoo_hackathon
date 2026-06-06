const bcrypt = require("bcrypt");
const db = require("./db");
const authController = require("./authController");

const roleIdMap = {
  1: "Admin",
  2: "Vendor",
  3: "Procurement Officer",
  4: "Manager",
};

const formatUserResponse = (user) => ({
  id: user.user_id,
  fullName: user.full_name,
  email: user.email,
  role: roleIdMap[user.role_id] || "Vendor",
  googleId: user.google_id,
  profilePicture: user.profile_picture,
  hasPassword: Boolean(user.password),
  created_at: user.created_at,
});

const getProfile = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT user_id, full_name, email, role_id, google_id, profile_picture, password, created_at FROM tbl_users WHERE user_id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ user: formatUserResponse(result.rows[0]) });
  } catch (error) {
    console.error("[Profile] GET error:", error);
    return res.status(500).json({ message: "An error occurred while retrieving your profile." });
  }
};

const updateProfile = async (req, res) => {
  const { fullName, profilePicture } = req.body;

  try {
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ message: "Full name is required and must be at least 2 characters." });
    }

    if (profilePicture !== undefined && profilePicture !== null && profilePicture !== "") {
      try {
        const parsed = new URL(profilePicture);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return res.status(400).json({ message: "Profile picture must be a valid HTTP or HTTPS URL." });
        }
      } catch {
        return res.status(400).json({ message: "Profile picture must be a valid URL." });
      }
    }

    const result = await db.query(
      `UPDATE tbl_users
       SET full_name = $1,
           profile_picture = COALESCE($2, profile_picture),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3
       RETURNING user_id, full_name, email, role_id, google_id, profile_picture, password, created_at`,
      [fullName.trim(), profilePicture || null, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      message: "Profile updated successfully.",
      user: formatUserResponse(result.rows[0]),
    });
  } catch (error) {
    console.error("[Profile] PUT error:", error);
    return res.status(500).json({ message: "An error occurred while updating your profile." });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  try {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Current password, new password, and confirm password are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirm password do not match." });
    }

    const isStrong = authController.isStrongPassword
      ? authController.isStrongPassword(newPassword)
      : newPassword.length >= 8;

    if (!isStrong) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    const result = await db.query(
      "SELECT user_id, password, google_id FROM tbl_users WHERE user_id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = result.rows[0];

    if (!user.password) {
      return res.status(400).json({
        message: "This account uses Google sign-in only. Password change is not available.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password must be different from your current password." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE tbl_users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
      [passwordHash, user.user_id]
    );

    return res.json({
      message: "Password changed successfully. Please log in again with your new password.",
      requireReLogin: true,
    });
  } catch (error) {
    console.error("[Profile] Change password error:", error);
    return res.status(500).json({ message: "An error occurred while changing your password." });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
