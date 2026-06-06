const bcrypt = require("bcrypt");
const db = require("../db");
const { getRoleIdByName } = require("./roleService");

const seedAdminFromEnv = async () => {
  const email = process.env.ADMIN_EMAIL || "admin@vendorbridge.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@12345!";
  const fullName = process.env.ADMIN_FULL_NAME || "System Administrator";

  const roleId = await getRoleIdByName("Admin");
  const passwordHash = await bcrypt.hash(password, 10);

  const existingUser = await db.query("SELECT user_id FROM tbl_users WHERE email = $1", [email]);
  if (existingUser.rows.length > 0) {
    await db.query(
      "UPDATE tbl_users SET full_name = $1, password = $2, role_id = $3, google_id = NULL, is_verified = true WHERE email = $4",
      [fullName, passwordHash, roleId, email]
    );
    return { created: true, updated: true, email };
  }

  await db.query(
    "INSERT INTO tbl_users (full_name, email, password, role_id, is_verified) VALUES ($1, $2, $3, $4, true)",
    [fullName, email, passwordHash, roleId]
  );

  return { created: true, updated: false, email };
};

module.exports = { seedAdminFromEnv };