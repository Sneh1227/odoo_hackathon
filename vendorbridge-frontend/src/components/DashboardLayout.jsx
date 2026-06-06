import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import { toast } from "react-toastify";

const DashboardLayout = ({ children, role = "Guest", activeTab = "overview" }) => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [user, setUser] = useState(() => {
    const userJson = localStorage.getItem("user");
    return userJson ? JSON.parse(userJson) : { fullName: "User Profile", email: "user@vendorbridge.com", is_verified: false };
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.setAttribute("data-bs-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.setAttribute("data-bs-theme", "light");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.getProfile();
        if (res && res.user) {
          localStorage.setItem("user", JSON.stringify(res.user));
          setUser(res.user);
        }
      } catch (err) {
        console.error("Error syncing user profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    toast.success("Logged out successfully.");
    navigate("/login");
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Mock notifications based on role
  const getNotifications = () => {
    switch (role) {
      case "Admin":
        return [
          { id: 1, text: "System database online.", time: "10m ago", read: false },
          { id: 2, text: "New vendor registered and pending approval.", time: "2h ago", read: false }
        ];
      case "Vendor":
        return [
          { id: 1, text: "Check your registration status updates.", time: "5m ago", read: false }
        ];
      case "Procurement Officer":
        return [
          { id: 1, text: "Quotation received from Acme Corp.", time: "1h ago", read: false }
        ];
      case "Manager":
        return [
          { id: 1, text: "New quotation approval request for QT-8941.", time: "15m ago", read: false }
        ];
      default:
        return [];
    }
  };

  const notifications = getNotifications();

  // Highlight active sidebar links
  const getSidebarLinks = () => {
    const links = [];
    if (role === "Admin") {
      links.push(
        { key: "overview", label: "Dashboard", icon: "bi-speedometer2", path: "/admin/dashboard?tab=overview" },
        { key: "users", label: "User Accounts", icon: "bi-people", path: "/admin/dashboard?tab=users" },
        { key: "rfqs", label: "RFQs List", icon: "bi-file-earmark-text", path: "/admin/dashboard?tab=rfqs" },
        { key: "quotations", label: "Quotations", icon: "bi-chat-left-quote", path: "/admin/dashboard?tab=quotations" },
        { key: "invoices", label: "Invoices & Revenue", icon: "bi-cash-coin", path: "/admin/dashboard?tab=invoices" }
      );
    } else if (role === "Vendor") {
      links.push(
        { key: "overview", label: "My Overview", icon: "bi-house-door", path: "/vendor/dashboard?tab=overview" }
      );
      if (user && user.is_verified) {
        links.push(
          { key: "rfqs", label: "Open RFQs", icon: "bi-search", path: "/vendor/dashboard?tab=rfqs" },
          { key: "bids", label: "My Quotations", icon: "bi-check-all", path: "/vendor/dashboard?tab=bids" },
          { key: "orders", label: "Purchase Orders", icon: "bi-file-zip", path: "/vendor/dashboard?tab=orders" },
          { key: "invoices", label: "Submitted Invoices", icon: "bi-receipt", path: "/vendor/dashboard?tab=invoices" }
        );
      }
    } else if (role === "Procurement Officer") {
      links.push(
        { key: "overview", label: "Procurement Analytics", icon: "bi-graph-up-arrow", path: "/procurement/dashboard?tab=overview" },
        { key: "vendors", label: "Vendor Profiles", icon: "bi-buildings", path: "/procurement/dashboard?tab=vendors" },
        { key: "response", label: "RFQ Response Matrix", icon: "bi-bar-chart", path: "/procurement/dashboard?tab=response" },
        { key: "spend", label: "Spend Distribution", icon: "bi-pie-chart", path: "/procurement/dashboard?tab=spend" }
      );
    } else if (role === "Manager") {
      links.push(
        { key: "overview", label: "Manager Dashboard", icon: "bi-briefcase", path: "/manager/dashboard?tab=overview" },
        { key: "approvals", label: "Pending Approvals", icon: "bi-clipboard-check", path: "/manager/dashboard?tab=approvals" }
      );
    }
    return links;
  };

  const sidebarLinks = getSidebarLinks();

  return (
    <div className="d-flex min-vh-100 bg-body-tertiary">
      {/* Sidebar - No Print */}
      <aside className={`sidebar d-flex flex-column no-print ${sidebarOpen ? "active" : ""}`}>
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <span className="navbar-brand fw-bold fs-5 text-primary d-flex align-items-center gap-2">
            <i className="bi bi-shuffle fs-4"></i>
            <span>VendorBridge</span>
          </span>
          <button 
            className="btn btn-sm d-md-none border-0" 
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="flex-grow-1 py-3 overflow-y-auto">
          <div className="px-3 mb-2 small text-uppercase text-muted font-monospace fw-bold">
            Navigation
          </div>
          {sidebarLinks.map((link) => (
            <Link
              key={link.key}
              to={link.path}
              className={`sidebar-link ${activeTab === link.key ? "active" : ""}`}
            >
              <i className={`bi ${link.icon} fs-5`}></i>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="p-3 border-top mt-auto">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div
              className="rounded-circle bg-primary text-white fw-bold d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: "36px", height: "36px", fontSize: "14px", flexShrink: 0 }}
            >
              {user.fullName ? user.fullName.split(" ").map(w => w[0]).join("").slice(0, 2) : "U"}
            </div>
            <div className="text-start text-muted" style={{ lineHeight: "1.2", minWidth: 0 }}>
              <div className="small fw-semibold text-truncate text-body" style={{ maxWidth: "160px" }}>{user.fullName}</div>
              <div className="small text-truncate" style={{ fontSize: "11px" }}>{role}</div>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-2 mb-2" 
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>Sign Out</span>
          </button>
          <div className="text-center text-muted font-monospace" style={{ fontSize: "10px" }}>
            v1.0.0 ERP System
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-grow-1 d-flex flex-column min-vh-100 overflow-hidden main-content">
        {/* Navbar - No Print */}
        <header className="navbar navbar-expand-lg bg-card border-bottom px-4 py-2.5 d-flex align-items-center justify-content-between no-print shadow-sm sticky-top">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-outline-secondary btn-sm rounded-3 px-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="bi bi-list fs-5"></i>
            </button>
            <h5 className="m-0 fw-semibold text-truncate d-none d-sm-inline-block">
              {role} Workspace
            </h5>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Dark Mode Switcher */}
            <button
              className="btn btn-link nav-link p-2 text-secondary theme-toggle"
              onClick={toggleDarkMode}
              title="Toggle theme"
            >
              {darkMode ? <i className="bi bi-sun-fill text-warning fs-5"></i> : <i className="bi bi-moon-fill text-primary fs-5"></i>}
            </button>

            {/* Notification Panel */}
            <div className="position-relative">
              <button
                className="btn btn-link nav-link p-2 text-secondary position-relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <i className="bi bi-bell-fill fs-5"></i>
                {notifications.some(n => !n.read) && (
                  <span className="position-absolute top-1 start-75 translate-middle p-1.5 bg-danger border border-light rounded-circle"></span>
                )}
              </button>

              {showNotifications && (
                <div
                  className="position-absolute end-0 mt-2 bg-body border rounded shadow-lg p-0"
                  style={{ width: "320px", zIndex: 1100 }}
                >
                  <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-light">
                    <h6 className="m-0 fw-bold">Notifications</h6>
                    <button 
                      className="btn-close btn-sm" 
                      onClick={() => setShowNotifications(false)}
                    ></button>
                  </div>
                  <div className="list-group list-group-flush" style={{ maxHeight: "250px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div className="p-3 text-center text-muted small">No notifications</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`list-group-item p-3 ${!notif.read ? "bg-primary-subtle" : ""}`}
                        >
                          <div className="small text-body fw-medium">{notif.text}</div>
                          <div className="small text-muted mt-1 text-end font-monospace" style={{ fontSize: "10px" }}>{notif.time}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="dropdown">
              <button
                className="btn d-flex align-items-center gap-2 border-0 bg-transparent"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div
                  className="rounded-circle bg-primary text-white fw-bold d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: "36px", height: "36px", fontSize: "14px" }}
                >
                  {user.fullName ? user.fullName.split(" ").map(w => w[0]).join("").slice(0, 2) : "U"}
                </div>
                <div className="text-start d-none d-md-block" style={{ lineHeight: "1.2" }}>
                  <div className="small fw-semibold">{user.fullName}</div>
                  <div className="small text-muted" style={{ fontSize: "11px" }}>{role}</div>
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                <li className="dropdown-header text-start">
                  <div className="fw-bold">{user.fullName}</div>
                  <div className="small text-muted">{user.email}</div>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>Sign out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-grow-1 p-4 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
