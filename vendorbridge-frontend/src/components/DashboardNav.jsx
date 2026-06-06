import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const rolePrefixMap = {
  Admin: "/admin",
  Vendor: "/vendor",
  "Procurement Officer": "/procurement",
  Manager: "/manager",
};

const themeClasses = {
  primary: {
    navbar: "navbar-dark bg-primary",
    avatarText: "text-primary",
  },
  success: {
    navbar: "navbar-dark bg-success",
    avatarText: "text-success",
  },
  info: {
    navbar: "navbar-dark bg-info",
    avatarText: "text-info",
  },
  secondary: {
    navbar: "navbar-dark bg-secondary",
    avatarText: "text-secondary",
  },
};

const DashboardNav = ({ theme = "primary" }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const classes = themeClasses[theme] || themeClasses.primary;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const profilePath = `${rolePrefixMap[user?.role] || ""}/profile`;

  return (
    <nav className={`navbar navbar-expand-lg ${classes.navbar} shadow-sm px-4`}>
      <span className="navbar-brand fw-bold fs-4">
        <i className="bi bi-shuffle me-2"></i>VendorBridge ERP
      </span>
      <div className="ms-auto d-flex align-items-center gap-3">
        <div className="text-white text-end d-none d-sm-block">
          <div className="fw-semibold">{user?.fullName}</div>
          <div className="small opacity-75">{user?.role} Portal</div>
        </div>
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt="Profile"
            className="rounded-circle border border-2 border-white"
            style={{ width: "40px", height: "40px", objectFit: "cover" }}
          />
        ) : (
          <div
            className={`rounded-circle bg-white ${classes.avatarText} fw-bold d-flex align-items-center justify-content-center`}
            style={{ width: "40px", height: "40px" }}
          >
            {user?.fullName ? user.fullName.charAt(0) : "U"}
          </div>
        )}
        <button
          type="button"
          onClick={() => navigate(profilePath)}
          className="btn btn-outline-light btn-sm"
        >
          <i className="bi bi-person-circle me-1"></i>Profile
        </button>
        <button type="button" onClick={handleLogout} className="btn btn-outline-light btn-sm">
          <i className="bi bi-box-arrow-right me-1"></i>Logout
        </button>
      </div>
    </nav>
  );
};

export default DashboardNav;
