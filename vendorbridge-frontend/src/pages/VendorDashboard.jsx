import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { dashboardService } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import "bootstrap/dist/css/bootstrap.min.css";

const VendorDashboard = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab") || "overview";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    tables: {}
  });

  // Quotation Submission states
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [rfqItems, setRfqItems] = useState([]);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [remarks, setRemarks] = useState("");
  const [itemPrices, setItemPrices] = useState({});
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState("");

  const handleOpenQuoteModal = async (rfq) => {
    try {
      setSelectedRfq(rfq);
      setDeliveryDays(7);
      setRemarks("");
      setItemPrices({});
      setQuoteSuccessMsg("");
      setShowQuoteModal(true);
      
      const res = await dashboardService.getRfqDetails(rfq.rfq_id);
      if (res.success) {
        setRfqItems(res.items);
        const initialPrices = {};
        res.items.forEach(item => {
          initialPrices[item.rfq_item_id] = "";
        });
        setItemPrices(initialPrices);
      } else {
        alert(res.message || "Failed to load RFQ items.");
        setShowQuoteModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load RFQ details.");
      setShowQuoteModal(false);
    }
  };

  const handlePriceChange = (itemId, val) => {
    setItemPrices(prev => ({
      ...prev,
      [itemId]: val
    }));
  };

  const calculateTotalBid = () => {
    let total = 0;
    rfqItems.forEach(item => {
      const price = Number(itemPrices[item.rfq_item_id] || 0);
      total += price * Number(item.quantity);
    });
    return total;
  };

  const handleSubmitQuotation = async (e) => {
    e.preventDefault();
    if (!selectedRfq) return;

    const itemsPayload = [];
    for (const item of rfqItems) {
      const price = itemPrices[item.rfq_item_id];
      if (!price || isNaN(price) || Number(price) <= 0) {
        alert(`Please enter a valid unit price for ${item.item_name}`);
        return;
      }
      itemsPayload.push({
        rfq_item_id: item.rfq_item_id,
        unit_price: Number(price)
      });
    }

    try {
      setSubmittingQuote(true);
      const res = await dashboardService.submitQuotation({
        rfq_id: selectedRfq.rfq_id,
        delivery_days: Number(deliveryDays),
        remarks: remarks,
        items: itemsPayload
      });

      if (res.success) {
        setQuoteSuccessMsg(`Quotation ${res.quotation_no} submitted successfully!`);
        await fetchVendorDashboard();
        setTimeout(() => {
          setShowQuoteModal(false);
          setSelectedRfq(null);
          setRfqItems([]);
        }, 3000);
      } else {
        alert(res.message || "Failed to submit quotation.");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "An error occurred while submitting quotation.");
    } finally {
      setSubmittingQuote(false);
    }
  };

  const fetchVendorDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getVendorData();
      if (res.success) {
        setDashboardData(res);
        setError(null);
        
        // Sync local storage state in case verification status changed
        const userJson = localStorage.getItem("user");
        if (userJson) {
          const user = JSON.parse(userJson);
          localStorage.setItem("user", JSON.stringify({
            ...user,
            is_verified: res.summary.isVerified,
            status: res.summary.userStatus
          }));
        }
      } else {
        setError(res.message || "Failed to load vendor data.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch dashboard data. Please make sure backend is online.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorDashboard();
  }, []);

  const { summary, tables } = dashboardData;
  const isVerified = summary?.isVerified;
  const userStatus = summary?.userStatus || "Pending";

  const renderStats = () => (
    <div className="row g-4 mb-4">
      <div className="col-md-3">
        <div className="card border-0 shadow-sm p-4 bg-card d-flex flex-row align-items-center gap-3">
          <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
            <i className="bi bi-file-earmark-text fs-3"></i>
          </div>
          <div>
            <div className="text-muted small">Open RFQs</div>
            <h3 className="fw-bold m-0">{summary.rfqsAvailable || 0}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm p-4 bg-card d-flex flex-row align-items-center gap-3">
          <div className="rounded-circle bg-info-subtle text-info d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
            <i className="bi bi-chat-left-quote fs-3"></i>
          </div>
          <div>
            <div className="text-muted small">Bids Submitted</div>
            <h3 className="fw-bold m-0">{summary.quotesSubmitted || 0}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
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
      <div className="col-md-3">
        <div className="card border-0 shadow-sm p-4 bg-card d-flex flex-row align-items-center gap-3">
          <div className="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
            <i className="bi bi-cart-check fs-3"></i>
          </div>
          <div>
            <div className="text-muted small">POs Received</div>
            <h3 className="fw-bold m-0">{summary.posReceived || 0}</h3>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="row g-4">
      {/* Welcome banner */}
      <div className="col-12">
        <div className="card border-0 bg-success-subtle text-success-emphasis p-4 shadow-sm">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h4 className="fw-bold mb-1">Welcome back, {summary.vendorName}!</h4>
              <p className="m-0 opacity-75">Your vendor bridge portal is active. Track open bids, invoices, and receive purchase orders from procurement administrators instantly.</p>
            </div>
            <div className="badge bg-success px-3 py-2 fs-6">Verified Partner</div>
          </div>
        </div>
      </div>

      {/* Main stats */}
      <div className="col-12">
        {renderStats()}
      </div>

      {/* Tables section */}
      <div className="col-lg-8">
        <div className="card border-0 shadow-sm bg-card mb-4">
          <div className="card-header bg-transparent border-0 py-3">
            <h5 className="fw-bold m-0">Recent RFQs In Circulation</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4">RFQ Ref</th>
                    <th>Title</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!tables?.latestRfqs || tables.latestRfqs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">No open RFQs circulating currently.</td>
                    </tr>
                  ) : (
                    tables.latestRfqs.map((rfq) => (
                      <tr key={rfq.rfq_id}>
                        <td className="px-4 fw-semibold">{rfq.rfq_no}</td>
                        <td>{rfq.title}</td>
                        <td>{new Date(rfq.deadline_date).toLocaleDateString()}</td>
                        <td><span className="badge bg-success-subtle text-success">Open</span></td>
                        <td className="text-end pe-4">
                          <button 
                            className="btn btn-sm btn-primary py-0.5 px-2"
                            onClick={() => handleOpenQuoteModal(rfq)}
                          >
                            <i className="bi bi-chat-left-quote me-1"></i>Quote
                          </button>
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
          <h5 className="fw-bold mb-3">Profile Info</h5>
          <ul className="list-group list-group-flush">
            <li className="list-group-item bg-transparent d-flex justify-content-between px-0">
              <span className="text-muted">Vendor ID</span>
              <span className="fw-semibold font-monospace">VND-{summary.vendorId}</span>
            </li>
            <li className="list-group-item bg-transparent d-flex justify-content-between px-0">
              <span className="text-muted">Rating</span>
              <span className="fw-semibold text-warning"><i className="bi bi-star-fill me-1"></i>5.0 / 5.0</span>
            </li>
            <li className="list-group-item bg-transparent d-flex justify-content-between px-0">
              <span className="text-muted">Status</span>
              <span className="badge bg-success">Active</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderRfqs = () => (
    <div className="card border-0 shadow-sm bg-card">
      <div className="card-header bg-transparent border-0 py-3">
        <h5 className="fw-bold m-0">All Open Request For Quotations</h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">RFQ ID</th>
                <th>RFQ Ref</th>
                <th>RFQ Description / Specifications</th>
                <th>Deadline Date</th>
                <th>Status</th>
                <th className="text-end pe-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {!tables?.latestRfqs || tables.latestRfqs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">No RFQs found.</td>
                </tr>
              ) : (
                tables.latestRfqs.map((rfq) => (
                  <tr key={rfq.rfq_id}>
                    <td className="px-4 font-monospace">#{rfq.rfq_id}</td>
                    <td className="fw-bold">{rfq.rfq_no}</td>
                    <td>
                      <strong>{rfq.title}</strong>
                      <div className="text-muted small mt-1">{rfq.description || rfq.status}</div>
                    </td>
                    <td>{new Date(rfq.deadline_date).toLocaleDateString()}</td>
                    <td><span className="badge bg-success-subtle text-success">{rfq.status}</span></td>
                    <td className="text-end pe-4">
                      <button 
                        className="btn btn-sm btn-primary py-1 px-3"
                        onClick={() => handleOpenQuoteModal(rfq)}
                      >
                        <i className="bi bi-chat-left-quote me-1"></i>Submit Quote
                      </button>
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

  const renderBids = () => (
    <div className="card border-0 shadow-sm bg-card">
      <div className="card-header bg-transparent border-0 py-3">
        <h5 className="fw-bold m-0">My Submitted Quotations (Bids)</h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">Quote Ref</th>
                <th>Total Bid Amount</th>
                <th>Submission Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!tables?.quotesTracking || tables.quotesTracking.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted">No bids submitted yet.</td>
                </tr>
              ) : (
                tables.quotesTracking.map((quote) => (
                  <tr key={quote.quotation_id}>
                    <td className="px-4 fw-semibold">{quote.quotation_no}</td>
                    <td>INR {quote.total_amount?.toLocaleString() || quote.total_amount}</td>
                    <td>{new Date(quote.submission_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${
                        quote.status === "Approved" ? "bg-success" : 
                        quote.status === "Rejected" ? "bg-danger" : "bg-warning text-dark"
                      }`}>
                        {quote.status}
                      </span>
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

  const renderOrders = () => (
    <div className="card border-0 shadow-sm bg-card">
      <div className="card-header bg-transparent border-0 py-3">
        <h5 className="fw-bold m-0">Purchase Orders Received</h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">PO Ref</th>
                <th>Quotation Ref</th>
                <th>PO Date</th>
                <th>Order Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!tables?.purchaseOrders || tables.purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">No purchase orders received yet.</td>
                </tr>
              ) : (
                tables.purchaseOrders.map((po) => (
                  <tr key={po.po_id}>
                    <td className="px-4 fw-bold">{po.po_no}</td>
                    <td>{po.quotation_no}</td>
                    <td>{new Date(po.po_date).toLocaleDateString()}</td>
                    <td className="fw-bold">INR {po.total_amount?.toLocaleString() || po.total_amount}</td>
                    <td>
                      <span className="badge bg-success">
                        {po.status}
                      </span>
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

  const renderInvoices = () => (
    <div className="card border-0 shadow-sm bg-card">
      <div className="card-header bg-transparent border-0 py-3">
        <h5 className="fw-bold m-0">Submitted Invoices</h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">Invoice Ref</th>
                <th>PO Ref</th>
                <th>Invoice Date</th>
                <th>Invoiced Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!tables?.invoices || tables.invoices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">No invoices submitted.</td>
                </tr>
              ) : (
                tables.invoices.map((inv) => (
                  <tr key={inv.invoice_id}>
                    <td className="px-4 fw-bold">{inv.invoice_no}</td>
                    <td>{inv.po_no}</td>
                    <td>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                    <td className="fw-bold">INR {inv.total_amount?.toLocaleString() || inv.total_amount}</td>
                    <td>
                      <span className={`badge ${
                        inv.status === "Paid" ? "bg-success" : "bg-warning text-dark"
                      }`}>
                        {inv.status}
                      </span>
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

  const renderContent = () => {
    switch (tab) {
      case "rfqs":
        return renderRfqs();
      case "bids":
        return renderBids();
      case "orders":
        return renderOrders();
      case "invoices":
        return renderInvoices();
      default:
        return renderOverview();
    }
  };

  // Render the lock screen overlay when vendor is pending or declined
  const renderLockScreen = () => {
    const isPending = userStatus === "Pending";
    return (
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3"
        style={{ 
          background: "rgba(15, 23, 42, 0.45)", 
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          transition: "all 0.3s ease"
        }}
      >
        <div className="card border-0 shadow-lg p-5 text-center bg-card max-width-md mx-3 rounded-4" style={{ maxWidth: "480px" }}>
          <div className="mb-4">
            <div 
              className={`rounded-circle mx-auto d-flex align-items-center justify-content-center ${
                isPending ? "bg-warning-subtle text-warning" : "bg-danger-subtle text-danger"
              }`} 
              style={{ width: "80px", height: "80px" }}
            >
              <i className={`bi ${isPending ? "bi-lock-fill" : "bi-shield-x"} fs-1`}></i>
            </div>
          </div>
          
          <h3 className="fw-bold text-card-title mb-2">
            {isPending ? "Verification Pending" : "Registration Declined"}
          </h3>
          
          <p className="text-muted mb-4 small">
            {isPending 
              ? "Your vendor account is currently undergoing credential review by procurement administrators. You will be notified by email once approved."
              : "We regret to inform you that your registration application has been declined. Please consult your email logs for notes on missing criteria."
            }
          </p>

          <div className="alert bg-light border text-start small mb-4 font-monospace py-3 px-3">
            <strong>Status Code:</strong> {userStatus} <br />
            <strong>Vendor Email:</strong> {summary.email || "Under Review"} <br />
            <strong>Date:</strong> {new Date().toLocaleDateString()}
          </div>

          <button 
            className="btn btn-outline-secondary w-100 rounded-3 py-2.5 fs-6 fw-semibold"
            onClick={async () => {
              await dashboardService.getVendorData().catch(() => {});
              window.location.reload();
            }}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>Check Updates
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <div className="spinner-border text-success" role="status">
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
          <button className="btn btn-danger btn-sm mt-3" onClick={fetchVendorDashboard}>
            Retry Request
          </button>
        </div>
      </div>
    );
  }

  const renderQuoteModal = () => {
    if (!selectedRfq) return null;
    const totalBid = calculateTotalBid();

    return (
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        role="dialog"
        style={{ background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(4px)", zIndex: 1050 }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
          <div className="modal-content border-0 shadow-lg bg-card rounded-3">
            <div className="modal-header border-bottom bg-light py-3 px-4 rounded-top-3">
              <h5 className="modal-title fw-bold text-body">
                Submit Quotation for {selectedRfq.rfq_no}
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => { setShowQuoteModal(false); setSelectedRfq(null); }}
                disabled={submittingQuote}
              ></button>
            </div>
            <form onSubmit={handleSubmitQuotation}>
              <div className="modal-body p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                {quoteSuccessMsg ? (
                  <div className="alert alert-success border-0 shadow-sm p-4 text-center rounded-3 my-3">
                    <i className="bi bi-patch-check-fill text-success fs-1 mb-2 d-block"></i>
                    <h5 className="fw-bold mb-2">Submission Successful</h5>
                    <p className="m-0 text-muted">{quoteSuccessMsg}</p>
                  </div>
                ) : (
                  <>
                    <div className="card bg-light border-0 p-3 mb-4 rounded-3">
                      <div className="row g-2">
                        <div className="col-sm-6">
                          <span className="small text-muted font-monospace d-block">RFQ Reference</span>
                          <span className="fw-bold text-body">{selectedRfq.rfq_no}</span>
                        </div>
                        <div className="col-sm-6">
                          <span className="small text-muted font-monospace d-block">RFQ Title</span>
                          <span className="fw-semibold text-body">{selectedRfq.title}</span>
                        </div>
                      </div>
                    </div>

                    <h6 className="fw-bold mb-3 text-body">Items Specifications & Pricing</h6>
                    <div className="table-responsive mb-4 border rounded-3">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="ps-3">Item Name</th>
                            <th>Qty Required</th>
                            <th style={{ width: "160px" }}>Unit Price (INR)</th>
                            <th className="pe-3 text-end" style={{ width: "160px" }}>Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rfqItems.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="text-center py-4 text-muted">
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Loading item specifications...
                              </td>
                            </tr>
                          ) : (
                            rfqItems.map((item) => {
                              const qty = Number(item.quantity);
                              const price = Number(itemPrices[item.rfq_item_id] || 0);
                              const lineTotal = qty * price;
                              return (
                                <tr key={item.rfq_item_id}>
                                  <td className="ps-3">
                                    <div className="fw-semibold text-body">{item.item_name}</div>
                                    <div className="small text-muted">{item.description}</div>
                                  </td>
                                  <td>
                                    <span className="fw-medium text-body">{qty}</span>{" "}
                                    <span className="text-muted small">{item.unit || "Units"}</span>
                                  </td>
                                  <td>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text bg-transparent text-muted">₹</span>
                                      <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        value={itemPrices[item.rfq_item_id] || ""}
                                        onChange={(e) => handlePriceChange(item.rfq_item_id, e.target.value)}
                                        disabled={submittingQuote}
                                      />
                                    </div>
                                  </td>
                                  <td className="pe-3 text-end fw-bold text-body">
                                    ₹ {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                        {rfqItems.length > 0 && (
                          <tfoot className="table-light font-monospace">
                            <tr>
                              <td colSpan="3" className="ps-3 fw-bold text-end text-body">Estimated Total Bid Amount:</td>
                              <td className="pe-3 fw-bold text-end text-success fs-5">
                                ₹ {totalBid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-muted text-uppercase font-monospace">Est. Delivery (Days)</label>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          required
                          value={deliveryDays}
                          onChange={(e) => setDeliveryDays(e.target.value)}
                          disabled={submittingQuote}
                        />
                      </div>
                      <div className="col-md-8">
                        <label className="form-label small fw-bold text-muted text-uppercase font-monospace">Terms / Proposal Remarks</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder="Specify material grades, freight details, payment terms..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          disabled={submittingQuote}
                        ></textarea>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-3">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={() => { setShowQuoteModal(false); setSelectedRfq(null); }}
                  disabled={submittingQuote}
                >
                  Cancel
                </button>
                {!quoteSuccessMsg && (
                  <button 
                    type="submit" 
                    className="btn btn-success text-white px-4"
                    disabled={submittingQuote || rfqItems.length === 0}
                  >
                    {submittingQuote ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Submitting...
                      </>
                    ) : (
                      "Submit Quotation"
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout role="Vendor" activeTab={tab}>
      {renderContent()}
      {showQuoteModal && renderQuoteModal()}
      {!isVerified && renderLockScreen()}
    </DashboardLayout>
  );
};

export default VendorDashboard;
