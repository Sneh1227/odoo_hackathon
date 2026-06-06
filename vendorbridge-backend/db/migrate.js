const fs = require("fs");
const path = require("path");
const db = require("../db");

require("dotenv").config();

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function runMigrations() {
  try {
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("[Migration] No migration files found.");
      return;
    }

    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, "utf8");
      console.log(`[Migration] Running ${file}...`);
      await db.query(sql);
      console.log(`[Migration] Completed ${file}`);
    }

    console.log("[Migration] All migrations applied successfully.");
  } catch (error) {
    console.error("[Migration] Failed:", error.message);
    process.exit(1);
  } finally {
    if (db.pool && typeof db.pool.end === "function") {
      await db.pool.end();
    }
  }
}

runMigrations();
