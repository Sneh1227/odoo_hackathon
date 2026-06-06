import React from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : { fullName: "Vendor Partner", role: "Vendor" };

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  return (
    <div className="container-fluid min-vh-100 bg-light p-0">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-success shadow-sm px-4">
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
              className="rounded-circle bg-white text-success fw-bold d-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px" }}
            >
              {user.fullName ? user.fullName.charAt(0) : "V"}
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
            <h2 className="fw-bold text-dark mb-1">Vendor Dashboard</h2>
            <p className="text-muted">Submit Quotations, review open RFQs, and manage Purchase Orders</p>
          </div>
        </div>

        {/* Vendor Actions and Tables */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-white text-center">
              <div className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: "60px", height: "60px" }}>
                <i className="bi bi-send fs-3"></i>
              </div>
              <h5 className="fw-bold">Submit Quotation</h5>
              <p className="text-muted small">Submit formal commercial quotations for requested materials or services.</p>
              <button className="btn btn-success btn-sm mt-2">Submit Quote</button>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-white text-center">
              <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: "60px", height: "60px" }}>
                <i className="bi bi-file-earmark-medical fs-3"></i>
              </div>
              <h5 className="fw-bold">View Open RFQs</h5>
              <p className="text-muted small">Browse current Requests For Quotations and select bids you qualify for.</p>
              <button className="btn btn-primary btn-sm mt-2">Browse RFQs (14)</button>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-white text-center">
              <div className="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: "60px", height: "60px" }}>
                <i className="bi bi-cart-check fs-3"></i>
              </div>
              <h5 className="fw-bold">Purchase Orders</h5>
              <p className="text-muted small">Manage current Active Purchase Orders and upload delivery status updates.</p>
              <button className="btn btn-warning btn-sm mt-2 text-dark">Track Orders (3)</button>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm bg-white">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="fw-bold m-0">Recent RFQ Invitations</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="px-4">RFQ Ref</th>
                        <th>Material/Service Description</th>
                        <th>Procurement Manager</th>
                        <th>Response Deadline</th>
                        <th className="text-end px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 fw-semibold">RFQ-2026-0041</td>
                        <td>Server Racks & Cat6 Cabling installation</td>
                        <td>Jane Smith</td>
                        <td>June 15, 2026</td>
                        <td className="text-end px-4">
                          <button className="btn btn-sm btn-outline-success">Prepare Bid</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 fw-semibold">RFQ-2026-0039</td>
                        <td>Office Supplies & Stationery bulk delivery</td>
                        <td>Robert Davis</td>
                        <td>June 12, 2026</td>
                        <td className="text-end px-4">
                          <button className="btn btn-sm btn-outline-success">Prepare Bid</button>
                        </td>
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

export default VendorDashboard;
