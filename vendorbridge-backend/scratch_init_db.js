const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function initDb() {
  // 1. Connect to default 'postgres' database to create 'vendorbridge' if it doesn't exist
  const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "om",
    database: "postgres",
  });

  try {
    await client.connect();
    console.log("Connected to default postgres database.");

    // Check if vendorbridge database exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'vendorbridge'",
    );
    if (res.rows.length === 0) {
      console.log("Database 'vendorbridge' does not exist. Creating...");
      await client.query("CREATE DATABASE vendorbridge");
      console.log("Database 'vendorbridge' created successfully.");
    } else {
      console.log("Database 'vendorbridge' already exists.");
    }
  } catch (err) {
    console.error("Error checking/creating database:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }

  // 2. Connect to 'vendorbridge' database and run schema.sql
  const dbClient = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "om",
    database: "vendorbridge",
  });

  try {
    await dbClient.connect();
    console.log("Connected to 'vendorbridge' database.");

    const schemaPath = path.join(__dirname, "db", "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    console.log("Running schema.sql...");
    await dbClient.query(schemaSql);
    console.log("schema.sql executed successfully. Tables initialized.");
  } catch (err) {
    console.error("Error running schema.sql:", err.message);
  } finally {
    await dbClient.end();
  }
}

initDb();
