const express = require("express");
const cors = require("cors");
const passport = require("./passport");
const authRoutes = require("./authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { ensureDefaultRoles } = require("./services/roleService");
const { seedAdminFromEnv } = require("./services/adminProvision");
const profileRoutes = require("./profileRoutes");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) ||
                      /^https?:\/\/localhost:\d+$/.test(origin) ||
                      /^https?:\/\/127\.0\.0\.1:\d+$/.test(origin);
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "VendorBridge ERP Authentication Service",
    timestamp: new Date(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/profile", profileRoutes);

ensureDefaultRoles().catch((error) => {
  console.error("Failed to seed default roles:", error);
});

seedAdminFromEnv()
  .then((result) => {
    if (result?.skipped) {
      console.log("Admin seed skipped:", result.reason);
    } else if (result?.created) {
      console.log(`Admin account provisioned for ${result.email}`);
    }
  })
  .catch((error) => {
    console.error("Failed to provision admin account:", error);
  });

app.use((err, req, res, next) => {
  console.error("Unhandled Backend Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred on the server.",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

app.listen(PORT, () => {
  console.log(
    `VendorBridge ERP backend server running on port ${PORT} via app.js`,
  );
});

module.exports = app;
