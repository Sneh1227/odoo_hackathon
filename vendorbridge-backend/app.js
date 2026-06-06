const express = require("express");
const cors = require("cors");
const passport = require("./passport");
const authRoutes = require("./authRoutes");
const profileRoutes = require("./profileRoutes");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const defaultFrontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const allowedOrigins = new Set([
  defaultFrontendUrl,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
]);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
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
app.use("/api/profile", profileRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled Backend Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred on the server.",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

app.listen(PORT, () => {
  console.log(`VendorBridge ERP backend server running on port ${PORT} via app.js`);
});

module.exports = app;
