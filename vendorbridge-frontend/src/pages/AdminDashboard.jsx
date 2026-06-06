import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { dashboardService, authService } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import { AreaChart, BarChart, PieChart } from "../components/DashboardCharts";

// CSV Export Helper
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(row => 
    Object.values(row).map(val => {
      const strVal = String(val === null || val === undefined ? "" : val);
      return `"${strVal.replace(/"/g, '""')}"`;
    }).join(",")
  );
  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab") || "overview";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    summary: {},
    charts: {},
    tables: {},
    logs: [],
    users: []
  });

  // Table filters & status
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Vendor verification state
  const [verificationUser, setVerificationUser] = useState(null);
  const [verificationAction, setVerificationAction] = useState(null); // "Approve" or "Decline"
  const [remarks, setRemarks] = useState("");
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getAdminData();
      if (res.success) {
        setData(res);
        setError(null);
      } else {
        setError(res.message || "Failed to load admin dashboard data.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error fetching dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    setSearchTerm("");
    setStatusFilter("All");
    setCurrentPage(1);
    setVerificationUser(null);
    setVerificationAction(null);
    setRemarks("");
  }, [tab]);

  const handleActionClick = (user, actionType) => {
    setVerificationUser(user);
    setVerificationAction(actionType);
    setRemarks("");
  };

  const handleConfirmVerification = async () => {
    if (!verificationUser || !verificationAction) return;
    try {
      setSubmittingVerification(true);
      const res = await authService.approveVendor(
        verificationUser.user_id,
        verificationAction,
        remarks
      );
      setVerificationMsg(`Vendor account ${verificationUser.full_name} has been successfully ${verificationAction === "Approve" ? "approved" : "declined"}.`);
      setVerificationUser(null);
      setVerificationAction(null);
      setRemarks("");
      
      // Reload dashboard list
      await fetchDashboardData();
      setTimeout(() => setVerificationMsg(""), 4500);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to process verification decision.");
    } finally {
      setSubmittingVerification(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="Admin" activeTab={tab}>
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-50 py-5">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted font-monospace">Synchronizing ERP ledger...</h5>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="Admin" activeTab={tab}>
        <div className="alert alert-danger shadow border-0 p-4 rounded-3 text-center my-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-1 text-danger mb-3 d-block"></i>
          <h4 className="alert-heading fw-bold">Dashboard Sync Failed</h4>
          <p className="mb-3 text-secondary">{error}</p>
          <button className="btn btn-outline-danger px-4" onClick={fetchDashboardData}>
            <i className="bi bi-arrow-clockwise me-2"></i>Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Filter lists
  const getFilteredUsers = () => {
    return data.users.filter(u => {
      const matchSearch = 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === "All" || 
        (statusFilter === "Verified" && u.is_verified) ||
        (statusFilter === "Unverified" && !u.is_verified);

      return matchSearch && matchStatus;
    });
  };

  const getFilteredRfqs = () => {
    const rfqs = data.tables.recentRfqs || [];
    return rfqs.filter(r => {
      const matchSearch = 
        r.rfq_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  };

  const getFilteredQuotations = () => {
    const quotes = data.tables.recentQuotations || [];
    return quotes.filter(q => {
      const matchSearch = 
        q.quotation_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "All" || q.status === statusFilter;
      return matchSearch && matchStatus;
    });
  };

  const getFilteredInvoices = () => {
    const invoices = data.tables.recentInvoices || [];
    return invoices.filter(i => {
      const matchSearch = 
        i.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "All" || i.status === statusFilter;
      return matchSearch && matchStatus;
    });
  };

  const paginateData = (items) => {
    const offset = (currentPage - 1) * itemsPerPage;
    return items.slice(offset, offset + itemsPerPage);
  };

  return (
    <DashboardLayout role="Admin" activeTab={tab}>
      {/* Header Panel */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 border-bottom pb-3">
        <div>
          <h3 className="fw-bold m-0 text-body">System Administration Control</h3>
          <p className="text-muted m-0 small font-monospace">Real-time enterprise metrics from PostgreSQL</p>
        </div>
        <div className="d-flex align-items-center gap-2 no-print">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
            <i className="bi bi-printer me-1.5"></i>Print Report
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (tab === "users") exportToCSV(data.users, "VB_Users");
              else if (tab === "rfqs") exportToCSV(data.tables.recentRfqs, "VB_RFQs");
              else if (tab === "quotations") exportToCSV(data.tables.recentQuotations, "VB_Quotations");
              else if (tab === "invoices") exportToCSV(data.tables.recentInvoices, "VB_Invoices");
              else exportToCSV(Object.entries(data.summary).map(([key, value]) => ({ metric: key, value })), "VB_Admin_Summary");
            }}
          >
            <i className="bi bi-file-earmark-excel me-1.5"></i>Export CSV
          </button>
        </div>
      </div>

      {/* Verification alerts */}
      {verificationMsg && (
        <div className="alert alert-success border-0 shadow-sm p-3 rounded-3 mb-4 d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-check-circle-fill text-success fs-5"></i>
          <div className="fw-medium">{verificationMsg}</div>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <>
          <div className="row g-3 mb-4">
            {[
              { title: "Total Vendors", value: data.summary.totalVendors, icon: "bi-buildings", color: "text-primary", bg: "bg-primary-subtle" },
              { title: "Active Vendors", value: data.summary.activeVendors, icon: "bi-patch-check", color: "text-success", bg: "bg-success-subtle" },
              { title: "Pending Approvals", value: data.summary.pendingVendors, icon: "bi-hourglass-split", color: "text-warning", bg: "bg-warning-subtle" },
              { title: "Total RFQs", value: data.summary.totalRfqs, icon: "bi-file-text", color: "text-info", bg: "bg-info-subtle" },
              { title: "Open RFQs", value: data.summary.openRfqs, icon: "bi-file-earmark-medical", color: "text-danger", bg: "bg-danger-subtle" },
              { title: "Total Invoices", value: data.summary.totalInvoices, icon: "bi-receipt-cutoff", color: "text-secondary", bg: "bg-secondary-subtle" },
              { title: "Invoice Revenue", value: `$${(data.summary.invoiceRevenue || 0).toLocaleString()}`, icon: "bi-currency-dollar", color: "text-success", bg: "bg-success-subtle", full: true }
            ].map((card, idx) => (
              <div key={idx} className={card.full ? "col-md-6 col-lg-3" : "col-6 col-md-3 col-lg-3"}>
                <div className="card h-100 p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted small text-uppercase font-monospace">{card.title}</div>
                      <h4 className="fw-bold mt-1 mb-0">{card.value}</h4>
                    </div>
                    <div className={`p-2.5 rounded-3 ${card.bg} ${card.color}`}>
                      <i className={`bi ${card.icon} fs-4`}></i>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="card h-100 p-3">
                <h5 className="fw-bold mb-3">Enterprise Trends</h5>
                <ul className="nav nav-pills nav-fill mb-3 no-print" id="chart-tabs" role="tablist">
                  <li className="nav-item">
                    <button className="nav-link active py-1.5" id="rfq-chart-tab" data-bs-toggle="tab" data-bs-target="#rfq-chart" type="button">RFQs</button>
                  </li>
                  <li className="nav-item">
                    <button className="nav-link py-1.5" id="quote-chart-tab" data-bs-toggle="tab" data-bs-target="#quote-chart" type="button">Quotations</button>
                  </li>
                  <li className="nav-item">
                    <button className="nav-link py-1.5" id="rev-chart-tab" data-bs-toggle="tab" data-bs-target="#rev-chart" type="button">Revenue</button>
                  </li>
                </ul>
                <div className="tab-content" id="chart-tabs-content">
                  <div className="tab-pane fade show active" id="rfq-chart" role="tabpanel">
                    <AreaChart data={data.charts.rfqsTrend} dataKey="count" xKey="month" color="170, 59, 255" />
                  </div>
                  <div className="tab-pane fade" id="quote-chart" role="tabpanel">
                    <AreaChart data={data.charts.quotesTrend} dataKey="count" xKey="month" color="30, 144, 255" />
                  </div>
                  <div className="tab-pane fade" id="rev-chart" role="tabpanel">
                    <AreaChart data={data.charts.revenueTrend} dataKey="revenue" xKey="month" color="46, 117, 89" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card h-100 p-3">
                <h5 className="fw-bold mb-3">Approval Allocation</h5>
                <PieChart data={data.charts.approvalStatusDist} nameKey="status" valueKey="count" />
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between pt-3 px-3">
                  <h5 className="fw-bold m-0">System Activity Feed</h5>
                  <span className="badge bg-secondary font-monospace small">Live Logs</span>
                </div>
                <div className="card-body p-0" style={{ maxHeight: "380px", overflowY: "auto" }}>
                  <div className="list-group list-group-flush">
                    {data.logs.map((log) => (
                      <div key={log.log_id} className="list-group-item p-3">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div>
                            <span className="badge bg-secondary-subtle text-secondary me-2 small text-capitalize">{log.action}</span>
                            <span className="text-body small fw-medium">{log.description}</span>
                          </div>
                          <span className="text-muted font-monospace small" style={{ fontSize: "11px" }}>
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="small text-muted mt-1 font-monospace">Operator: {log.user_name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between pt-3 px-3">
                  <h5 className="fw-bold m-0">Recent Invoices</h5>
                  <span className="badge bg-success-subtle text-success font-monospace small">Invoices</span>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th className="ps-3">Invoice No</th>
                          <th>Vendor</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.tables.recentInvoices || []).map((inv) => (
                          <tr key={inv.invoice_id}>
                            <td className="ps-3 fw-bold font-monospace small">{inv.invoice_no}</td>
                            <td>{inv.vendor_name}</td>
                            <td className="fw-semibold text-body">${inv.total_amount.toLocaleString()}</td>
                            <td>
                              <span className={`badge-custom ${inv.status === "Paid" ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"}`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DYNAMIC LIST TABS */}
      {tab !== "overview" && (
        <div className="card p-3">
          {/* Action Form for Vendor Verification */}
          {tab === "users" && verificationUser && (
            <div className="card border-primary p-3 mb-4 shadow-sm bg-body-tertiary no-print">
              <h5 className="fw-bold text-body">
                Confirm Vendor Registration Verification: {verificationUser.full_name}
              </h5>
              <div className="my-2 small text-muted">
                Action: <strong className={verificationAction === "Approve" ? "text-success" : "text-danger"}>{verificationAction}</strong>.
                Enter comments/remarks that will be logged and emailed directly to the vendor's email address.
              </div>
              <div className="mb-3">
                <textarea
                  className="form-control form-control-sm"
                  rows="2"
                  placeholder="Enter administrator evaluation remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                ></textarea>
              </div>
              <div className="d-flex gap-2">
                <button
                  className={`btn btn-sm ${verificationAction === "Approve" ? "btn-success text-white" : "btn-danger text-white"}`}
                  onClick={handleConfirmVerification}
                  disabled={submittingVerification}
                >
                  {submittingVerification && <span className="spinner-border spinner-border-sm me-1"></span>}
                  Confirm & Send Notification
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => { setVerificationUser(null); setVerificationAction(null); }}
                  disabled={submittingVerification}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 no-print">
            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: "400px" }}>
              <i className="bi bi-search text-muted position-absolute ms-2"></i>
              <input
                type="text"
                className="form-control form-control-sm ps-4"
                placeholder={`Search ${tab}...`}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted font-monospace">Status:</span>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                style={{ width: "130px" }}
              >
                <option value="All">All Statuses</option>
                {tab === "users" && (
                  <>
                    <option value="Verified">Verified Vendors</option>
                    <option value="Unverified">Unverified/Pending</option>
                  </>
                )}
                {tab === "rfqs" && (
                  <>
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </>
                )}
                {tab === "quotations" && (
                  <>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </>
                )}
                {tab === "invoices" && (
                  <>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {tab === "users" && (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Verification Status</th>
                    <th>Registered At</th>
                    <th className="text-end px-3 no-print">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginateData(getFilteredUsers()).map(u => (
                    <tr key={u.user_id}>
                      <td className="font-monospace small">{u.user_id}</td>
                      <td>
                        <div className="fw-semibold text-body">{u.full_name}</div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === "Admin" ? "bg-danger" : u.role === "Manager" ? "bg-primary" : u.role === "Procurement Officer" ? "bg-info text-dark" : "bg-secondary"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.role === "Vendor" ? (
                          <span className={`badge ${u.is_verified ? "bg-success" : "bg-warning text-dark"}`}>
                            {u.is_verified ? "Approved / Active" : "Pending Verification"}
                          </span>
                        ) : (
                          <span className="text-muted small">N/A</span>
                        )}
                      </td>
                      <td className="font-monospace small">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="text-end px-3 no-print">
                        {u.role === "Vendor" && !u.is_verified ? (
                          <div className="btn-group">
                            <button 
                              className="btn btn-sm btn-success text-white py-0.5 px-2"
                              onClick={() => handleActionClick(u, "Approve")}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn btn-sm btn-danger text-white py-0.5 px-2"
                              onClick={() => handleActionClick(u, "Decline")}
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted small font-monospace">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {getFilteredUsers().length === 0 && (
                    <tr><td colSpan="7" className="text-center py-4 text-muted">No users matching search filters.</td></tr>
                  )}
                </tbody>
              </table>
              {getFilteredUsers().length > itemsPerPage && (
                <div className="d-flex justify-content-between align-items-center mt-3 no-print">
                  <span className="small text-muted font-monospace">Showing {paginateData(getFilteredUsers()).length} of {getFilteredUsers().length} users</span>
                  <div className="btn-group">
                    <button className="btn btn-outline-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
                    <button className="btn btn-outline-secondary btn-sm" disabled={currentPage * itemsPerPage >= getFilteredUsers().length} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "rfqs" && (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>RFQ No</th>
                    <th>Title</th>
                    <th>Deadline</th>
                    <th>Created At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginateData(getFilteredRfqs()).map(r => (
                    <tr key={r.rfq_id}>
                      <td className="fw-bold font-monospace text-primary">{r.rfq_no}</td>
                      <td className="fw-semibold text-body">{r.title}</td>
                      <td className="font-monospace small">{new Date(r.deadline_date).toLocaleDateString()}</td>
                      <td className="font-monospace small">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge-custom ${r.status === "Open" ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {getFilteredRfqs().length === 0 && (
                    <tr><td colSpan="5" className="text-center py-4 text-muted">No RFQs matching filters.</td></tr>
                  )}
                </tbody>
              </table>
              {getFilteredRfqs().length > itemsPerPage && (
                <div className="d-flex justify-content-between align-items-center mt-3 no-print">
                  <span className="small text-muted">Showing {paginateData(getFilteredRfqs()).length} of {getFilteredRfqs().length} RFQs</span>
                  <div className="btn-group">
                    <button className="btn btn-outline-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
                    <button className="btn btn-outline-secondary btn-sm" disabled={currentPage * itemsPerPage >= getFilteredRfqs().length} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "quotations" && (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Quotation ID</th>
                    <th>Ref No</th>
                    <th>Vendor Name</th>
                    <th>Total Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginateData(getFilteredQuotations()).map(q => (
                    <tr key={q.quotation_id}>
                      <td className="font-monospace small">{q.quotation_id}</td>
                      <td className="fw-bold font-monospace">{q.quotation_no}</td>
                      <td>{q.vendor_name}</td>
                      <td className="fw-semibold text-body">${q.total_amount.toLocaleString()}</td>
                      <td>
                        <span className={`badge-custom ${q.status === "Approved" ? "bg-success-subtle text-success" : q.status === "Rejected" ? "bg-danger-subtle text-danger" : "bg-warning-subtle text-warning"}`}>
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {getFilteredQuotations().length === 0 && (
                    <tr><td colSpan="5" className="text-center py-4 text-muted">No quotations matching filters.</td></tr>
                  )}
                </tbody>
              </table>
              {getFilteredQuotations().length > itemsPerPage && (
                <div className="d-flex justify-content-between align-items-center mt-3 no-print">
                  <span className="small text-muted">Showing {paginateData(getFilteredQuotations()).length} of {getFilteredQuotations().length} quotations</span>
                  <div className="btn-group">
                    <button className="btn btn-outline-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
                    <button className="btn btn-outline-secondary btn-sm" disabled={currentPage * itemsPerPage >= getFilteredQuotations().length} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "invoices" && (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Invoice Date</th>
                    <th>Vendor Name</th>
                    <th>Revenue Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginateData(getFilteredInvoices()).map(i => (
                    <tr key={i.invoice_id}>
                      <td className="fw-bold font-monospace text-primary">{i.invoice_no}</td>
                      <td className="font-monospace small">{new Date(i.invoice_date).toLocaleDateString()}</td>
                      <td>{i.vendor_name}</td>
                      <td className="fw-bold text-success">${i.total_amount.toLocaleString()}</td>
                      <td>
                        <span className={`badge-custom ${i.status === "Paid" ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"}`}>
                          {i.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {getFilteredInvoices().length === 0 && (
                    <tr><td colSpan="5" className="text-center py-4 text-muted">No invoices matching filters.</td></tr>
                  )}
                </tbody>
              </table>
              {getFilteredInvoices().length > itemsPerPage && (
                <div className="d-flex justify-content-between align-items-center mt-3 no-print">
                  <span className="small text-muted">Showing {paginateData(getFilteredInvoices()).length} of {getFilteredInvoices().length} invoices</span>
                  <div className="btn-group">
                    <button className="btn btn-outline-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
                    <button className="btn btn-outline-secondary btn-sm" disabled={currentPage * itemsPerPage >= getFilteredInvoices().length} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
