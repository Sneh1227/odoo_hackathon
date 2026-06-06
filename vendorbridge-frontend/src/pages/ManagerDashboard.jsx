import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { dashboardService } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import "bootstrap/dist/css/bootstrap.min.css";

const ManagerDashboard = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab") || "overview";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    summary: {},
    pendingApprovals: []
  });

  const [remarksState, setRemarksState] = useState({});
  const [actioningId, setActioningId] = useState(null);

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getManagerData();
      if (res.success) {
        setData(res);
        setError(null);
      } else {
        setError(res.message || "Failed to load manager dashboard.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to backend dashboard service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
  }, [tab]);

  const handleDecision = async (approvalId, decision) => {
    const remarks = remarksState[approvalId] || "";
    try {
      setActioningId(approvalId);
      const res = await dashboardService.handleApproval(approvalId, decision, remarks);
      if (res.success) {
        toast.success(`Quotation request successfully ${decision.toLowerCase()}!`);
        // Refresh dashboard data
        await fetchManagerData();
        // Clear remarks for this approval
        setRemarksState((prev) => {
          const next = { ...prev };
          delete next[approvalId];
          return next;
        });
      } else {
        toast.error(res.message || "Failed to apply approval decision.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error sending approval decision to backend.");
    } finally {
      setActioningId(null);
    }
  };

  const { summary, pendingApprovals } = data;

  const renderStats = () => (
    <div className="row g-4 mb-4">
      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm p-4 bg-card d-flex flex-row align-items-center gap-3">
          <div className="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
            <i className="bi bi-clock-history fs-3"></i>
          </div>
          <div>
            <div className="text-muted small">Pending Decisions</div>
            <h3 className="fw-bold m-0">{summary.pendingApprovals || 0}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm p-4 bg-card d-flex flex-row align-items-center gap-3">
          <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
            <i className="bi bi-briefcase fs-3"></i>
          </div>
          <div>
            <div className="text-muted small">Total Handled</div>
            <h3 className="fw-bold m-0">{summary.totalHandled || 0}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm p-4 bg-card d-flex flex-row align-items-center gap-3">
          <div className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
            <i className="bi bi-check-circle fs-3"></i>
          </div>
          <div>
            <div className="text-muted small">Approved Quotes</div>
            <h3 className="fw-bold m-0">{summary.approvedQuotes || 0}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm p-4 bg-card d-flex flex-row align-items-center gap-3">
          <div className="rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
            <i className="bi bi-x-circle fs-3"></i>
          </div>
          <div>
            <div className="text-muted small">Rejected Quotes</div>
            <h3 className="fw-bold m-0">{summary.rejectedQuotes || 0}</h3>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQueue = () => (
    <div className="card border-0 shadow-sm bg-card mb-4">
      <div className="card-header bg-transparent border-0 py-3 d-flex align-items-center justify-content-between">
        <h5 className="fw-bold m-0">Pending Approvals Queue</h5>
        <span className="badge bg-danger px-3 py-2 fs-6">{pendingApprovals.length} Requisitions</span>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">Request ID</th>
                <th>Vendor</th>
                <th>Total Value</th>
                <th>Submission Date</th>
                <th>Decision / Comment Remarks</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">No pending approvals found in your queue. All caught up!</td>
                </tr>
              ) : (
                pendingApprovals.map((approval) => (
                  <tr key={approval.approval_id}>
                    <td className="px-4 fw-semibold">QT-{approval.quotation_no}</td>
                    <td>
                      <strong>{approval.vendor_name}</strong>
                    </td>
                    <td className="fw-bold text-primary">INR {approval.total_amount?.toLocaleString() || approval.total_amount}</td>
                    <td>{new Date(approval.submission_date).toLocaleDateString()}</td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="Enter remarks..." 
                        className="form-control form-control-sm"
                        style={{ maxWidth: "200px" }}
                        value={remarksState[approval.approval_id] || ""}
                        onChange={(e) => setRemarksState({ ...remarksState, [approval.approval_id]: e.target.value })}
                        disabled={actioningId === approval.approval_id}
                      />
                    </td>
                    <td className="text-end px-4">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <button 
                          className="btn btn-sm btn-success d-flex align-items-center gap-1"
                          onClick={() => handleDecision(approval.approval_id, "Approved")}
                          disabled={actioningId !== null}
                        >
                          {actioningId === approval.approval_id ? (
                            <span className="spinner-border spinner-border-sm"></span>
                          ) : <i className="bi bi-check-circle"></i>}
                          Approve
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                          onClick={() => handleDecision(approval.approval_id, "Rejected")}
                          disabled={actioningId !== null}
                        >
                          <i className="bi bi-x-circle"></i>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="row g-4">
      <div className="col-12">
        {renderStats()}
      </div>
      <div className="col-12">
        {renderQueue()}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (tab) {
      case "approvals":
        return renderQueue();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger max-width-md mx-auto" style={{ maxWidth: "600px" }}>
          <h5 className="fw-bold">Connection Failed</h5>
          <p className="m-0">{error}</p>
          <button className="btn btn-secondary btn-sm mt-3" onClick={fetchManagerData}>
            Retry Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout role="Manager" activeTab={tab}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default ManagerDashboard;
