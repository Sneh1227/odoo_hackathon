import React from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";

const ProcurementDashboard = () => {
  const navigate = useNavigate();
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : { fullName: "Procurement Officer", role: "Procurement Officer" };

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  return (
    <div className="container-fluid min-vh-100 bg-light p-0">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-info shadow-sm px-4">
        <span className="navbar-brand fw-bold fs-4 text-white">
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
              className="rounded-circle bg-white text-info fw-bold d-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px" }}
            >
              {user.fullName ? user.fullName.charAt(0) : "P"}
            </div>
          )}
          <button onClick={handleLogout} className="btn btn-outline-light btn-sm text-white">
            <i className="bi bi-box-arrow-right me-1"></i>Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-5">
        <div className="row mb-4">
          <div className="col">
            <h2 className="fw-bold text-dark mb-1">Procurement Officer Dashboard</h2>
            <p className="text-muted">Initiate Requests for Quotations, compare bids, generate invoices, and dispatch Purchase Orders.</p>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="row g-4 mb-5">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-4 bg-white text-center">
              <div className="rounded-circle bg-info-subtle text-info d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: "50px", height: "50px" }}>
                <i className="bi bi-plus-circle fs-4"></i>
              </div>
              <h6 className="fw-bold">Create RFQ</h6>
              <p className="text-muted small">Draft new procurement requests.</p>
              <button className="btn btn-info btn-sm text-white mt-2">New RFQ</button>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-4 bg-white text-center">
              <div className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: "50px", height: "50px" }}>
                <i className="bi bi-bar-chart-steps fs-4"></i>
              </div>
              <h6 className="fw-bold">Compare Quotes</h6>
              <p className="text-muted small">Evaluate bidding structures.</p>
              <button className="btn btn-success btn-sm mt-2">Compare</button>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-4 bg-white text-center">
              <div className="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: "50px", height: "50px" }}>
                <i className="bi bi-receipt fs-4"></i>
              </div>
              <h6 className="fw-bold">Generate PO</h6>
              <p className="text-muted small">Authorize Purchase Orders.</p>
              <button className="btn btn-warning btn-sm text-dark mt-2">Generate</button>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-4 bg-white text-center">
              <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: "50px", height: "50px" }}>
                <i className="bi bi-file-earmark-diff fs-4"></i>
              </div>
              <h6 className="fw-bold">Invoices</h6>
              <p className="text-muted small">Manage incoming billing records.</p>
              <button className="btn btn-primary btn-sm mt-2">Review Invoices</button>
            </div>
          </div>
        </div>

        {/* Workload overview */}
        <div className="row">
          <div className="col-md-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="fw-bold m-0">Procurement Activity Queue</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="px-4">Doc ID</th>
                        <th>Workflow Stage</th>
                        <th>Associated Vendor</th>
                        <th>Estimate Value</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 fw-semibold">RFQ-2026-104</td>
                        <td><span className="badge bg-warning text-dark">Quotations Pending</span></td>
                        <td>Multiple (3 Invitations)</td>
                        <td>$45,000</td>
                        <td><button className="btn btn-sm btn-outline-info">View Bids</button></td>
                      </tr>
                      <tr>
                        <td className="px-4 fw-semibold">PO-2026-894</td>
                        <td><span className="badge bg-success-subtle text-success">Approved by Manager</span></td>
                        <td>Acme Corporation</td>
                        <td>$12,500</td>
                        <td><button className="btn btn-sm btn-outline-info">Dispatch PDF</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcurementDashboard;
