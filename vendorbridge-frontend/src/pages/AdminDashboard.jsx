import React from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : { fullName: "Administrator", role: "Admin" };

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  return (
    <div className="container-fluid min-vh-100 bg-light p-0">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm px-4">
        <span className="navbar-brand fw-bold fs-4">
          <i className="bi bi-shuffle me-2"></i>VendorBridge ERP
        </span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <div className="text-white text-end d-none d-sm-block">
            <div className="fw-semibold">{user.fullName}</div>
            <div className="small opacity-75">{user.role} Portal</div>
          </div>
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt="Profile"
              className="rounded-circle border border-2 border-white"
              style={{ width: "40px", height: "40px", objectFit: "cover" }}
            />
          ) : (
            <div
              className="rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px" }}
            >
              {user.fullName ? user.fullName.charAt(0) : "A"}
            </div>
          )}
          <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
            <i className="bi bi-box-arrow-right me-1"></i>Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-5">
        <div className="row mb-4">
          <div className="col">
            <h2 className="fw-bold text-dark mb-1">Admin Dashboard</h2>
            <p className="text-muted">System Administration & Enterprise Management Control Panel</p>
          </div>
        </div>

        {/* Dashboard Status Cards */}
        <div className="row g-4 mb-5">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted mb-1 text-uppercase small font-monospace">Active Users</h6>
                  <h3 className="fw-bold m-0">1,248</h3>
                </div>
                <div className="bg-primary-subtle text-primary p-3 rounded-3">
                  <i className="bi bi-people fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted mb-1 text-uppercase small font-monospace">Active Vendors</h6>
                  <h3 className="fw-bold m-0">342</h3>
                </div>
                <div className="bg-success-subtle text-success p-3 rounded-3">
                  <i className="bi bi-building fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted mb-1 text-uppercase small font-monospace">System Health</h6>
                  <h3 className="fw-bold m-0 text-success">99.9%</h3>
                </div>
                <div className="bg-info-subtle text-info p-3 rounded-3">
                  <i className="bi bi-cpu fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted mb-1 text-uppercase small font-monospace">Open RFQs</h6>
                  <h3 className="fw-bold m-0">47</h3>
                </div>
                <div className="bg-warning-subtle text-warning p-3 rounded-3">
                  <i className="bi bi-file-earmark-text fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roles & Admin Actions Panel */}
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="fw-bold m-0">System User Management</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="px-4">User</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th className="text-end px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>JD</div>
                          <div>
                            <div className="fw-semibold">John Doe</div>
                            <div className="small text-muted">john@vendorbridge.com</div>
                          </div>
                        </td>
                        <td><span className="badge bg-secondary">Procurement Officer</span></td>
                        <td><span className="badge bg-success-subtle text-success">Active</span></td>
                        <td>June 5, 2026</td>
                        <td className="text-end px-4">
                          <button className="btn btn-sm btn-outline-secondary me-1">Edit</button>
                          <button className="btn btn-sm btn-danger-subtle text-danger">Disable</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-success-subtle text-success fw-bold d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>AC</div>
                          <div>
                            <div className="fw-semibold">Acme Corporation</div>
                            <div className="small text-muted">billing@acme.com</div>
                          </div>
                        </td>
                        <td><span className="badge bg-warning text-dark">Vendor</span></td>
                        <td><span className="badge bg-success-subtle text-success">Active</span></td>
                        <td>June 4, 2026</td>
                        <td className="text-end px-4">
                          <button className="btn btn-sm btn-outline-secondary me-1">Edit</button>
                          <button className="btn btn-sm btn-danger-subtle text-danger">Disable</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm bg-white mb-4">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="fw-bold m-0">Admin Actions</h5>
              </div>
              <div className="card-body pt-0">
                <div className="d-grid gap-2">
                  <button className="btn btn-primary text-start px-3 py-2">
                    <i className="bi bi-person-plus me-2"></i>Provision New User
                  </button>
                  <button className="btn btn-outline-primary text-start px-3 py-2">
                    <i className="bi bi-shield-check me-2"></i>Assign Security Roles
                  </button>
                  <button className="btn btn-outline-primary text-start px-3 py-2">
                    <i className="bi bi-gear me-2"></i>Global ERP System Settings
                  </button>
                  <button className="btn btn-outline-primary text-start px-3 py-2">
                    <i className="bi bi-file-earmark-bar-graph me-2"></i>System Access Audit Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
