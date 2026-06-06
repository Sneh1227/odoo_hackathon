import React from "react";
import DashboardNav from "../components/DashboardNav";

const ManagerDashboard = () => {
  return (
    <div className="container-fluid min-vh-100 bg-light p-0">
      <DashboardNav theme="secondary" />

      {/* Main Content */}
      <div className="container py-5">
        <div className="row mb-4">
          <div className="col">
            <h2 className="fw-bold text-dark mb-1">Manager Approvals Dashboard</h2>
            <p className="text-muted">Approve or reject open procurement requests and monitor entire workflow statistics.</p>
          </div>
        </div>

        {/* Action Table */}
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm bg-white mb-4">
              <div className="card-header bg-white border-0 py-3 d-flex align-items-center justify-content-between">
                <h5 className="fw-bold m-0">Pending Approvals Queue</h5>
                <span className="badge bg-danger">2 Action Items</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="px-4">Request ID</th>
                        <th>Procurement Item</th>
                        <th>Initiator</th>
                        <th>Total Value</th>
                        <th className="text-end px-4">Decision Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 fw-semibold">PR-2026-009</td>
                        <td>Dell Latitudes laptops batch supply</td>
                        <td>John Doe (Officer)</td>
                        <td className="fw-semibold">$24,500</td>
                        <td className="text-end px-4">
                          <button className="btn btn-sm btn-success me-2">
                            <i className="bi bi-check-circle me-1"></i>Approve
                          </button>
                          <button className="btn btn-sm btn-danger">
                            <i className="bi bi-x-circle me-1"></i>Reject
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 fw-semibold">PR-2026-012</td>
                        <td>Conference Room Audio systems setup</td>
                        <td>John Doe (Officer)</td>
                        <td className="fw-semibold">$6,400</td>
                        <td className="text-end px-4">
                          <button className="btn btn-sm btn-success me-2">
                            <i className="bi bi-check-circle me-1"></i>Approve
                          </button>
                          <button className="btn btn-sm btn-danger">
                            <i className="bi bi-x-circle me-1"></i>Reject
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Overview Card */}
        <div className="row">
          <div className="col-md-12">
            <div className="card border-0 shadow-sm bg-white p-4">
              <h5 className="fw-bold mb-3">Procurement Workflow Monitoring</h5>
              <div className="progress mb-3" style={{ height: "24px" }}>
                <div className="progress-bar bg-success" role="progressbar" style={{ width: "45%" }} aria-valuenow="45" aria-valuemin="0" aria-valuemax="100">Approved POs (45%)</div>
                <div className="progress-bar bg-warning text-dark" role="progressbar" style={{ width: "35%" }} aria-valuenow="35" aria-valuemin="0" aria-valuemax="100">Bidding Phase (35%)</div>
                <div className="progress-bar bg-danger" role="progressbar" style={{ width: "20%" }} aria-valuenow="20" aria-valuemin="0" aria-valuemax="100">Under Review (20%)</div>
              </div>
              <p className="text-muted small mb-0">Total volume processed this month: <strong>$234,000</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
