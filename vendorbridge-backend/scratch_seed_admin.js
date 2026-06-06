require("dotenv").config();

const { seedAdminFromEnv } = require("./services/adminProvision");

seedAdminFromEnv()
  .then((result) => {
    if (result?.skipped) {
      console.log(`Skipped: ${result.reason}`);
      process.exit(0);
    }

    if (result?.created) {
      console.log(`Admin account provisioned for ${result.email}`);
      process.exit(0);
    }

    console.log("No admin changes were made.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed admin account:", error);
    process.exit(1);
  });