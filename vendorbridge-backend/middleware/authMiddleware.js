const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_vendorbridge_key_123!";

/**
 * JWT Authentication Middleware
 * Checks for Bearer token in the Authorization header.
 * Attaches decoded user payload (id, email, role) to req.user.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Access token is missing or invalid." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired access token." });
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
