/**
 * Role Authorization Middleware
 * Verifies that the authenticated user's role is permitted to access the resource.
 * Must be used AFTER authenticateToken middleware.
 * 
 * @param {...string} allowedRoles - List of authorized roles
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = authorizeRoles;
