import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { dashboardService } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import { AreaChart, BarChart, PieChart } from "../components/DashboardCharts";
import "bootstrap/dist/css/bootstrap.min.css";

const ProcurementDashboard = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab") || "overview";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    summary: {},
    analytics: {}
  });

  const fetchProcurementData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getProcurementData();
      if (res.success) {
        setData(res);
        setError(null);
      } else {
        setError(res.message || "Failed to load procurement data.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch procurement metrics. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcurementData();
  }, [tab]);

  const { summary, analytics } = data;

  const renderStats = () => (
    <div className="row g-4 mb-4">
      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm p-4 bg-card d-flex flex-row align-items-center gap-3">
          <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
            <i className="bi bi-file-earmark-text fs-3"></i>
          </div>
          <div>
            <div className="text-muted small">Total RFQs</div>
            <h3 className="fw-bold m-0">{summary.totalRfqs || 0}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm p-4 bg-card d-flex flex-row align-items-center gap-3">
          <div className="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
            <i className="bi bi-folder2-open fs-3"></i>
          </div>
          <div>
            <div className="text-muted small">Open RFQs</div>
            <h3 className="fw-bold m-0">{summary.openRfqs || 0}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm p-4 bg-card d-flex flex-row align-items-center gap-3">
          <div className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
            <i className="bi bi-chat-left-quote fs-3"></i>
          </div>
          <div>
            <div className="text-muted small">Quotes Received</div>
            <h3 className="fw-bold m-0">{summary.quotesReceived || 0}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm p-4 bg-card d-flex flex-row align-items-center gap-3">
          <div className="rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
            <i className="bi bi-clock-history fs-3"></i>
          </div>
          <div>
            <div className="text-muted small">Avg Turnaround</div>
            <h3 className="fw-bold m-0">{analytics.avgTurnaroundDays ? `${analytics.avgTurnaroundDays} days` : "0 days"}</h3>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => {
    // Category Spend Arc formatting
    const spendChartData = analytics.spendByCategory?.map((c) => ({
      name: c.category || "Unassigned",
      value: c.total_spend || 0
    })) || [];

    // Vendor response rate labels/values
    const responseLabels = analytics.rfqResponseRate?.map((r) => r.rfq_no) || [];
    const responseValues = analytics.rfqResponseRate?.map((r) => r.response_count) || [];

    return (
      <div className="row g-4">
        <div className="col-12">
          {renderStats()}
        </div>

        {/* Spend distribution and RFQ Response rates */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm bg-card p-4">
            <h5 className="fw-bold mb-3">Spend Category Distribution</h5>
            <div style={{ height: "300px" }}>
              <PieChart data={spendChartData} />
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm bg-card p-4">
            <h5 className="fw-bold mb-3">RFQ Response Rates</h5>
            <div style={{ height: "300px" }}>
              <BarChart labels={responseLabels} data={responseValues} title="Quotation Responses" />
            </div>
          </div>
        </div>

        {/* Top Vendors list */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm bg-card mb-4">
            <div className="card-header bg-transparent border-0 py-3">
              <h5 className="fw-bold m-0">Top Active Vendors by Performance</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4">Vendor Name</th>
                      <th>Core Category</th>
                      <th>Quality Rating</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!analytics.vendorPerformance || analytics.vendorPerformance.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">No vendors registered in the system.</td>
                      </tr>
                    ) : (
                      analytics.vendorPerformance.map((v) => (
                        <tr key={v.vendor_id}>
                          <td className="px-4 fw-semibold">{v.vendor_name}</td>
                          <td>{v.category || "General Procurement"}</td>
                          <td>
                            <span className="text-warning"><i className="bi bi-star-fill me-1"></i>{parseFloat(v.rating).toFixed(1)}</span>
                          </td>
                          <td>
                            <span className={`badge ${v.status === 'Active' ? 'bg-success' : 'bg-warning text-dark'}`}>{v.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm bg-card p-4">
            <h5 className="fw-bold mb-3">Manager Approval Velocity</h5>
            <div className="alert bg-light border text-start small mb-0 font-monospace py-3 px-3">
              <strong>Pending approvals:</strong> {summary.pendingApprovals || 0} <br />
              <strong>POs generated:</strong> {summary.posGenerated || 0} <br />
              <strong>Transact rate:</strong> {summary.posGenerated ? `${((summary.posGenerated / summary.totalRfqs) * 100).toFixed(0)}%` : "0%"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVendors = () => (
    <div className="card border-0 shadow-sm bg-card">
      <div className="card-header bg-transparent border-0 py-3">
        <h5 className="fw-bold m-0">Vendor Directory & Profiles</h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">Vendor ID</th>
                <th>Vendor Name</th>
                <th>Category</th>
                <th>Rating</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!analytics.vendorPerformance || analytics.vendorPerformance.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">No vendors found.</td>
                </tr>
              ) : (
                analytics.vendorPerformance.map((v) => (
                  <tr key={v.vendor_id}>
                    <td className="px-4 font-monospace">VND-{v.vendor_id}</td>
                    <td className="fw-bold">{v.vendor_name}</td>
                    <td>{v.category || "General"}</td>
                    <td className="text-warning"><i className="bi bi-star-fill me-1"></i>{parseFloat(v.rating).toFixed(1)}</td>
                    <td><span className={`badge ${v.status === 'Active' ? 'bg-success' : 'bg-warning text-dark'}`}>{v.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderResponseMatrix = () => {
    const responseLabels = analytics.rfqResponseRate?.map((r) => r.title) || [];
    const responseValues = analytics.rfqResponseRate?.map((r) => r.response_count) || [];
    return (
      <div className="card border-0 shadow-sm bg-card p-4">
        <h5 className="fw-bold mb-4">RFQ Quotation Response Analysis</h5>
        <div style={{ height: "400px" }}>
          <BarChart labels={responseLabels} data={responseValues} title="Response Count per RFQ Requisition" />
        </div>
      </div>
    );
  };

  const renderSpendDistribution = () => {
    const spendChartData = analytics.spendByCategory?.map((c) => ({
      name: c.category || "General",
      value: c.total_spend || 0
    })) || [];
    return (
      <div className="card border-0 shadow-sm bg-card p-4">
        <h5 className="fw-bold mb-4">Requisition Spend Breakdown</h5>
        <div style={{ height: "400px" }}>
          <PieChart data={spendChartData} />
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (tab) {
      case "vendors":
        return renderVendors();
      case "response":
        return renderResponseMatrix();
      case "spend":
        return renderSpendDistribution();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <div className="spinner-border text-info" role="status">
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
          <button className="btn btn-info btn-sm mt-3" onClick={fetchProcurementData}>
            Retry Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout role="Procurement Officer" activeTab={tab}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default ProcurementDashboard;
