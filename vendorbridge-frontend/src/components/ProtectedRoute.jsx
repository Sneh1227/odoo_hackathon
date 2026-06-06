import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute Guard Component
 * Ensures that the user is authenticated and possesses the proper role.
 *
 * @param {React.ReactElement} children - Target component to render
 * @param {Array<string>} allowedRoles - Permitted roles (e.g. ['Admin', 'Manager'])
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");
  let user = null;

  try {
    user = userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error("Error parsing user info from localStorage", error);
  }

  // 1. Not authenticated: Redirect to login page
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Authenticated but role is not authorized: Redirect to their corresponding default dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`User role '${user.role}' not permitted for this path. Redirecting...`);
    
    // Redirect route map based on roles
    switch (user.role) {
      case "Admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "Vendor":
        return <Navigate to="/vendor/dashboard" replace />;
      case "Procurement Officer":
        return <Navigate to="/procurement/dashboard" replace />;
      case "Manager":
        return <Navigate to="/manager/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // 3. Authorized: Render children
  return children;
};

export default ProtectedRoute;
