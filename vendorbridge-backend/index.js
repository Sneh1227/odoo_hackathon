const express = require("express");
const cors = require("cors");
const passport = require("./config/passport");
const authRoutes = require("./routes/authRoutes");
const db = require("./db");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize passport
app.use(passport.initialize());

// Root test route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "VendorBridge ERP Authentication Service",
    timestamp: new Date(),
  });
});

// Register routes
app.use("/api/auth", authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Backend Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred on the server.",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`VendorBridge ERP backend server running on port ${PORT}`);
});
