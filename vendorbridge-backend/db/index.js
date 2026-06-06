const { Pool } = require("pg");
require("dotenv").config();

// PostgreSQL connection configuration
// Can connect via connection string (DATABASE_URL) or individual configuration parameters
const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL database successfully.");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
