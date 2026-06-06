const db = require("../db");

const DEFAULT_ROLES = ["Admin", "Vendor", "Procurement Officer", "Manager"];

const ensureDefaultRoles = async () => {
  for (const roleName of DEFAULT_ROLES) {
    const existingRole = await db.query("SELECT role_id FROM tbl_roles WHERE role_name = $1", [roleName]);
    if (existingRole.rows.length === 0) {
      await db.query("INSERT INTO tbl_roles (role_name) VALUES ($1)", [roleName]);
    }
  }
};

const getRoleIdByName = async (roleName) => {
  const existingRole = await db.query("SELECT role_id FROM tbl_roles WHERE role_name = $1", [roleName]);
  if (existingRole.rows.length > 0) {
    return existingRole.rows[0].role_id;
  }

  const insertedRole = await db.query(
    "INSERT INTO tbl_roles (role_name) VALUES ($1) RETURNING role_id",
    [roleName]
  );
  return insertedRole.rows[0].role_id;
};

const getRoleNameById = async (roleId) => {
  if (roleId == null) {
    return null;
  }

  const result = await db.query("SELECT role_name FROM tbl_roles WHERE role_id = $1", [roleId]);
  return result.rows[0]?.role_name || null;
};

module.exports = {
  DEFAULT_ROLES,
  ensureDefaultRoles,
  getRoleIdByName,
  getRoleNameById,
};