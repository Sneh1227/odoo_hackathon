import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const getRoleDashboard = (role) => {
  switch (role) {
    case "Admin":
      return "/admin/dashboard";
    case "Vendor":
      return "/vendor/dashboard";
    case "Procurement Officer":
      return "/procurement/dashboard";
    case "Manager":
      return "/manager/dashboard";
    default:
      return "/login";
  }
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3 mb-0">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`User role '${user.role}' not permitted for this path. Redirecting...`);
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
