import React from "react";
import { NavLink } from "react-router-dom";

const PortalShell = ({ user, navItems, title, subtitle, onLogout, children }) => {
  const initial = (user?.fullName || user?.name || "V").trim().charAt(0).toUpperCase();

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="brand-block">
          <div className="brand-mark">VB</div>
          <div>
            <div className="brand-name">VendorBridge</div>
            <div className="brand-subtitle">Procurement ERP</div>
          </div>
        </div>

        <div className="profile-chip">
          <div className="profile-avatar">{initial}</div>
          <div>
            <div className="profile-name">{user?.fullName || user?.name || "Portal User"}</div>
            <div className="profile-role">{user?.role || "Role-based access"}</div>
          </div>
        </div>

        <nav className="portal-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `portal-nav-link ${isActive ? "active" : ""}`}
            >
              <span>{item.label}</span>
              <i className="bi bi-chevron-right" />
            </NavLink>
          ))}
        </nav>

        <button type="button" className="btn portal-logout" onClick={onLogout}>
          <i className="bi bi-box-arrow-right me-2" />
          Sign out
        </button>
      </aside>

      <main className="portal-main">
        <header className="portal-topbar">
          <div>
            <p className="eyebrow">{subtitle}</p>
            <h1>{title}</h1>
          </div>
          <div className="portal-topbar-actions">
            <div className="topbar-pill">
              <i className="bi bi-shield-check me-2" />
              {user?.role || "Authenticated"}
            </div>
            <div className="topbar-pill highlight">
              <i className="bi bi-lightning-charge me-2" />
              Live procurement workspace
            </div>
          </div>
        </header>

        <section className="portal-content">{children}</section>
      </main>
    </div>
  );
};

export default PortalShell;
