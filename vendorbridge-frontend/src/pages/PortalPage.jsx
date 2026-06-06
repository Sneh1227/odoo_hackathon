import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { authService } from "../services/api";
import PortalShell from "../components/PortalShell";
import { navByRole } from "../data/portalSeed";
import { useProcurementPortal } from "../context/ProcurementContext";

const viewConfig = {
  dashboard: {
    title: "Command Center",
    subtitle: "Monitor procurement, approvals, purchase orders, and invoices.",
  },
  users: {
    title: "User Management",
    subtitle: "Administer user access and role-based platform visibility.",
  },
  vendors: {
    title: "Vendor Management",
    subtitle: "Register vendors, review verification status, and keep records clean.",
  },
  rfq: {
    title: "RFQ Creation",
    subtitle: "Draft request for quotation workflows and invite the right vendors.",
  },
  quotations: {
    title: "Quotation Center",
    subtitle: "Capture vendor bids and compare commercial offers side by side.",
  },
  approvals: {
    title: "Approval Workflow",
    subtitle: "Review, approve, or reject procurement requests with traceability.",
  },
  orders: {
    title: "Purchase Orders & Invoices",
    subtitle: "Generate POs, print invoices, and send billing documents by email.",
  },
  activity: {
    title: "Activity Logs",
    subtitle: "Follow procurement events, alerts, and audit history.",
  },
  reports: {
    title: "Reports & Analytics",
    subtitle: "Track spend, vendor performance, and procurement trends.",
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const toneClass = {
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  danger: "bg-danger-subtle text-danger",
  primary: "bg-primary-subtle text-primary",
  info: "bg-info-subtle text-info",
};

const MetricCard = ({ label, value, hint, icon, accent = "primary" }) => (
  <div className="metric-card">
    <div className={`metric-icon ${accent}`}>
      <i className={`bi ${icon}`} />
    </div>
    <div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-hint">{hint}</div>
    </div>
  </div>
);

const SectionTitle = ({ title, subtitle, action }) => (
  <div className="section-head">
    <div>
      <h3>{title}</h3>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
    {action}
  </div>
);

const Pill = ({ children, tone = "primary" }) => <span className={`status-pill ${tone}`}>{children}</span>;

const PortalPage = ({ role, view }) => {
  const navigate = useNavigate();
  const { state, summary, loading, fetchState, toggleUserStatus, upsertVendor, toggleVendorStatus, createRfq, submitQuotation, decideApproval, generatePurchaseOrderFromQuotation, generateInvoiceFromPo, markInvoiceEmailed } = useProcurementPortal();
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : { fullName: `${role} Portal`, role };

  useEffect(() => {
    fetchState();
  }, [view]);

  const [vendorQuery, setVendorQuery] = useState("");
  const [vendorForm, setVendorForm] = useState({ name: "", category: "", gst: "", contact: "", status: "Pending Review", verified: false, rating: "4.4", spend: "0" });
  const [rfqForm, setRfqForm] = useState({ title: "", description: "", deadline: "", vendors: "", requester: user.fullName || role, items: "" });
  const [quotationForm, setQuotationForm] = useState({ rfqId: state.rfqs[0]?.id || "", vendorId: state.vendors[0]?.id || "", amount: "", deliveryDays: "", notes: "", rating: "4.5" });
  const [approvalNotes, setApprovalNotes] = useState({});
  const [selectedRfqId, setSelectedRfqId] = useState(state.rfqs[0]?.id || "");
  const [selectedPoId, setSelectedPoId] = useState(state.purchaseOrders[0]?.id || "");
  const [activeApprovalId, setActiveApprovalId] = useState("");
  const [selectedRfqIdVendor, setSelectedRfqIdVendor] = useState("");
  const [vendorQuoteForm, setVendorQuoteForm] = useState({ amount: "", deliveryDays: "", notes: "" });

  const [selectedVendors, setSelectedVendors] = useState([]);
  const [addedItems, setAddedItems] = useState([]);
  const [selectedItemName, setSelectedItemName] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemUom, setItemUom] = useState("pcs");
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedQtnIdForPO, setSelectedQtnIdForPO] = useState("");

  const getSystemComparison = (rfqId) => {
    const quotes = state.quotations.filter((q) => q.rfqId === rfqId);
    if (quotes.length === 0) return null;

    const lowestPrice = quotes.reduce((best, q) => (!best || q.amount < best.amount ? q : best), null);
    const fastestDelivery = quotes.reduce((best, q) => (!best || q.deliveryDays < best.deliveryDays ? q : best), null);
    const bestRated = quotes.reduce((best, q) => (!best || q.rating > best.rating ? q : best), null);
    const recommended = lowestPrice;

    return { lowestPrice, fastestDelivery, bestRated, recommended };
  };

  const config = viewConfig[view] || viewConfig.dashboard;

  const navItems = navByRole[role] || navByRole.Vendor;

  const filteredVendors = useMemo(
    () => state.vendors.filter((item) => [item.name, item.category, item.contact, item.gst].some((value) => value.toLowerCase().includes(vendorQuery.toLowerCase()))),
    [state.vendors, vendorQuery]
  );

  const comparisonQuotes = useMemo(
    () => state.quotations.filter((item) => item.rfqId === selectedRfqId),
    [state.quotations, selectedRfqId]
  );

  const lowestQuote = useMemo(() => comparisonQuotes.reduce((best, item) => (!best || item.amount < best.amount ? item : best), null), [comparisonQuotes]);

  const currentVendor = useMemo(() => {
    if (role !== "Vendor") return null;
    return state.vendors.find(
      (v) => v.name.toLowerCase() === user.name?.toLowerCase() || 
             v.name.toLowerCase() === user.fullName?.toLowerCase() ||
             v.contact.toLowerCase().includes(user.email?.toLowerCase())
    ) || state.vendors[0];
  }, [state.vendors, user, role]);

  const assignedRfqs = useMemo(() => {
    if (!currentVendor) return [];
    return state.rfqs.filter((rfq) => rfq.vendorIds.includes(currentVendor.id));
  }, [state.rfqs, currentVendor]);

  const existingItems = useMemo(() => {
    const itemsMap = {};
    const catalog = ["Server Rack 24U", "Cat6 Ethernet Cable", "Housekeeping AMC", "A4 Copier Paper", "Stationery Kit Premium", "HVAC Maintenance AMC"];
    catalog.forEach(name => {
      itemsMap[name] = { name, uom: "pcs" };
    });
    (state.rfqs || []).forEach(rfq => {
      (rfq.items || []).forEach(item => {
        if (item.name) {
          itemsMap[item.name] = { name: item.name, uom: item.uom || "pcs" };
        }
      });
    });
    return Object.values(itemsMap);
  }, [state.rfqs]);

  const approvedQuotations = useMemo(() => {
    const approvedQIds = state.approvals
      .filter(app => app.state === "Approved")
      .map(app => app.quotationId);
    return state.quotations.filter(q => approvedQIds.includes(q.id));
  }, [state.approvals, state.quotations]);

  const activeQtnForPO = approvedQuotations.find(q => q.id === selectedQtnIdForPO);

  const selectedPo = state.purchaseOrders.find((item) => item.id === selectedPoId) || state.purchaseOrders[0];
  const selectedInvoice = state.invoices.find((item) => item.poId === selectedPo?.id) || state.invoices[0];

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  const submitVendor = (event) => {
    event.preventDefault();
    if (!vendorForm.name || !vendorForm.category || !vendorForm.gst) {
      toast.error("Please complete the vendor details.");
      return;
    }

    upsertVendor(vendorForm);
    toast.success("Vendor saved successfully.");
    setVendorForm({ name: "", category: "", gst: "", contact: "", status: "Pending Review", verified: false, rating: "4.4", spend: "0" });
  };

  const submitRfq = (event) => {
    event.preventDefault();
    if (!rfqForm.title || !rfqForm.description || !rfqForm.deadline) {
      toast.error("Please fill in title, description, and deadline date.");
      return;
    }
    if (addedItems.length === 0) {
      toast.error("Please add at least one item to the RFQ.");
      return;
    }
    if (selectedVendors.length === 0) {
      toast.error("Please select at least one vendor to invite.");
      return;
    }

    createRfq({
      title: rfqForm.title,
      description: rfqForm.description,
      deadline: rfqForm.deadline,
      vendorIds: selectedVendors,
      items: addedItems
    }).then(() => {
      toast.success("RFQ created and published successfully to database!");
      setRfqForm({ title: "", description: "", deadline: "", vendors: "", requester: user.fullName || role, items: "" });
      setSelectedVendors([]);
      setAddedItems([]);
    }).catch(err => {
      toast.error(err.response?.data?.message || "Failed to publish RFQ to database.");
    });
  };

  const handleGeneratePO = (quotationId) => {
    generatePurchaseOrderFromQuotation(quotationId)
      .then(() => {
        toast.success(`Purchase order generated for winning bid ${quotationId}!`);
        setSelectedQtnIdForPO("");
      })
      .catch(err => {
        toast.error(err.response?.data?.message || "Failed to generate Purchase Order.");
      });
  };

  const submitQuote = (event) => {
    event.preventDefault();
    const vendor = state.vendors.find((item) => item.id === quotationForm.vendorId);
    if (!vendor || !quotationForm.rfqId || !quotationForm.amount) {
      toast.error("Please choose an RFQ, vendor, and price.");
      return;
    }

    submitQuotation({
      rfqId: quotationForm.rfqId,
      vendorId: vendor.id,
      vendorName: vendor.name,
      amount: quotationForm.amount,
      deliveryDays: quotationForm.deliveryDays,
      notes: quotationForm.notes,
      rating: quotationForm.rating,
    });
    toast.success("Quotation submitted.");
    setQuotationForm({ rfqId: state.rfqs[0]?.id || "", vendorId: state.vendors[0]?.id || "", amount: "", deliveryDays: "", notes: "", rating: "4.5" });
  };

  const exportCsv = (fileName, rows) => {
    const csv = [rows[0] ? Object.keys(rows[0]).join(",") : ""].concat(rows.map((row) => Object.values(row).map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${fileName} downloaded.`);
  };

  const printInvoice = () => window.print();

  const emailInvoice = (invoice) => {
    if (!invoice) return;
    const subject = encodeURIComponent(`Invoice ${invoice.id}`);
    const body = encodeURIComponent(`Hello ${invoice.vendorName},\n\nPlease find invoice ${invoice.id} for ${formatCurrency(invoice.total)}.\n\nRegards,\nVendorBridge ERP`);
    window.location.href = `mailto:${invoice.recipient}?subject=${subject}&body=${body}`;
    markInvoiceEmailed(invoice.id);
    toast.success("Email composer opened.");
  };

  const dashboardBlocks = [
    { label: "Pending approvals", value: summary.pendingApprovals, hint: "Manager review queue", icon: "bi-bell", accent: "warning" },
    { label: "Active RFQs", value: summary.activeRfqs, hint: "Open procurement requests", icon: "bi-folder2-open", accent: "primary" },
    { label: "Verified vendors", value: summary.verifiedVendors, hint: "Trusted supplier pool", icon: "bi-patch-check", accent: "success" },
    { label: "Open invoices", value: summary.openInvoices, hint: "Waiting for dispatch", icon: "bi-receipt", accent: "info" },
  ];

  const renderDashboard = () => {
    if (role === "Vendor") {
      return renderVendorWorkspace();
    }
    if (role === "Manager") {
      return renderManagerDashboard();
    }

    return (
      <>
        <div className="hero-panel">
          <div>
            <Pill tone="info">Role: {role}</Pill>
            <h2>Run procurement from RFQ to invoice in one controlled workspace.</h2>
            <p>
              VendorBridge keeps approvals, quotations, purchase orders, invoices, and audit history in one place so the procurement team can move faster without losing control.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => navigate(navItems[1]?.path || "/login")}>Open workspace</button>
              <button className="btn btn-outline-light" onClick={() => navigate(navItems[navItems.length - 1]?.path || "/login")}>View reports</button>
            </div>
          </div>
          <div className="hero-metrics">
            <div className="metric-stack">
              <span>Monthly spend</span>
              <strong>{formatCurrency(summary.monthlySpend)}</strong>
            </div>
            <div className="metric-stack">
              <span>Live users</span>
              <strong>{summary.activeUsers}</strong>
            </div>
          </div>
        </div>

        <div className="metric-grid">
          {dashboardBlocks.map((block) => (
            <MetricCard key={block.label} {...block} />
          ))}
        </div>

        <div className="portal-grid two-up">
          <section className="panel-card">
            <SectionTitle title="Procurement workflow" subtitle="Current state of the procurement pipeline." />
            <div className="workflow-list">
              <div className="workflow-step done">RFQ created</div>
              <div className={`workflow-step ${summary.pendingApprovals ? "active" : "done"}`}>Quotation review</div>
              <div className={`workflow-step ${summary.pendingApprovals ? "active" : "done"}`}>Approvals</div>
              <div className="workflow-step done">PO & invoice</div>
            </div>
          </section>

          <section className="panel-card">
            <SectionTitle title="Quick actions" subtitle="Jump directly into the next operational step." />
            <div className="quick-links">
              {navItems.slice(1, 5).map((item) => (
                <button key={item.path} className="quick-link" onClick={() => navigate(item.path)}>
                  {item.label}
                  <i className="bi bi-arrow-right" />
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="panel-card mt-4">
          <SectionTitle title="Recent procurement activity" subtitle="The latest operational updates captured in the ERP." />
          <div className="timeline-list">
            {summary.latestActivities.map((item) => (
              <div key={item.id} className="timeline-item">
                <div className={`timeline-dot ${item.tone}`} />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <span>{item.time}</span>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  };

  const renderVendorWorkspace = () => {
    if (!currentVendor) {
      return <div className="alert alert-danger">Error: Vendor profile not found in master records.</div>;
    }

    const activeRfqId = selectedRfqIdVendor || assignedRfqs[0]?.id;
    const selectedRfq = assignedRfqs.find((rfq) => rfq.id === activeRfqId);

    const myQuotations = state.quotations.filter((q) => q.vendorId === currentVendor.id);
    const myPurchaseOrders = state.purchaseOrders.filter(
      (po) => po.vendorName.toLowerCase() === currentVendor.name.toLowerCase()
    );

    const handleVendorQuoteSubmit = (e) => {
      e.preventDefault();
      if (!activeRfqId) {
        toast.error("Please select an RFQ to respond to.");
        return;
      }
      if (!vendorQuoteForm.amount || !vendorQuoteForm.deliveryDays) {
        toast.error("Please input quotation amount and delivery timeline.");
        return;
      }

      submitQuotation({
        rfqId: activeRfqId,
        vendorId: currentVendor.id,
        vendorName: currentVendor.name,
        amount: Number(vendorQuoteForm.amount),
        deliveryDays: Number(vendorQuoteForm.deliveryDays),
        notes: vendorQuoteForm.notes || "",
        rating: currentVendor.rating || 4.5,
      });

      toast.success("Quotation submitted successfully to Procurement Officer.");
      setVendorQuoteForm({ amount: "", deliveryDays: "", notes: "" });
    };

    return (
      <div className="d-flex flex-column gap-4">
        <div className="hero-panel py-3 px-4 bg-primary text-white rounded">
          <div>
            <Pill tone="info">Vendor Workspace</Pill>
            <h2 className="mt-2">Welcome, {currentVendor.name}</h2>
            <p className="mb-0 text-white-50">
              Submit pricing offers for assigned RFQs, track approval status, and manage received purchase orders.
            </p>
          </div>
        </div>

        <div className="portal-grid two-up">
          <div className="d-flex flex-column gap-4">
            <section className="panel-card">
              <SectionTitle 
                title={`Assigned RFQs (${assignedRfqs.length})`} 
                subtitle="Select an RFQ request from the list to view specifications and submit bids." 
              />
              <div className="stack-list">
                {assignedRfqs.map((rfq) => (
                  <article 
                    key={rfq.id} 
                    className={`stack-row cursor-pointer ${activeRfqId === rfq.id ? "border-primary bg-primary-subtle" : ""}`}
                    onClick={() => setSelectedRfqIdVendor(rfq.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="w-100">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong>{rfq.id}</strong>
                        <Pill tone={rfq.status === "Open" ? "success" : "warning"}>{rfq.status}</Pill>
                      </div>
                      <h5 className="mb-1 text-dark" style={{ fontSize: "0.95rem" }}>{rfq.title}</h5>
                      <div className="text-muted small">Deadline: {rfq.deadline}</div>
                    </div>
                  </article>
                ))}
                {assignedRfqs.length === 0 && (
                  <div className="text-center text-muted p-4">No RFQs assigned to your vendor account yet.</div>
                )}
              </div>
            </section>

            {selectedRfq && (
              <section className="panel-card bg-light border border-light">
                <h4 className="mb-2 text-dark">RFQ Specifications: {selectedRfq.id}</h4>
                <p className="text-muted mb-3">{selectedRfq.description}</p>
                
                <h5 className="text-secondary small fw-semibold uppercase tracking-wider mb-2">Required Items</h5>
                <div className="table-responsive bg-white rounded border border-light">
                  <table className="table table-sm table-borderless align-middle mb-0 px-2 py-1">
                    <thead>
                      <tr className="border-bottom text-muted small">
                        <th>Item Name</th>
                        <th className="text-end">Qty</th>
                        <th className="text-center">UOM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedRfq.items || []).map((item, idx) => (
                        <tr key={idx} className="small">
                          <td><strong>{item.name}</strong></td>
                          <td className="text-end">{item.qty}</td>
                          <td className="text-center">{item.uom}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>

          <section className="panel-card">
            {selectedRfq ? (
              <div>
                <SectionTitle 
                  title="Submit Commercial Bid" 
                  subtitle={`Propose pricing and delivery terms for ${selectedRfq.id}.`} 
                />
                <form className="stack-form mt-3" onSubmit={handleVendorQuoteSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Quotation Amount (INR)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Total offer amount in INR"
                      value={vendorQuoteForm.amount}
                      onChange={(e) => setVendorQuoteForm({ ...vendorQuoteForm, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Delivery Timeline (Days)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Expected number of days for execution"
                      value={vendorQuoteForm.deliveryDays}
                      onChange={(e) => setVendorQuoteForm({ ...vendorQuoteForm, deliveryDays: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Vendor Remarks / Notes</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      placeholder="Specify commercial assumptions, support packages, or details..."
                      value={vendorQuoteForm.notes}
                      onChange={(e) => setVendorQuoteForm({ ...vendorQuoteForm, notes: e.target.value })}
                    />
                  </div>

                  <button className="btn btn-primary w-100 py-2 mt-2" type="submit">
                    <i className="bi bi-send-fill me-1" /> Submit Quotation Bid
                  </button>
                </form>
              </div>
            ) : (
              <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted p-5">
                <i className="bi bi-info-circle fs-1 mb-2" />
                <p>Select an RFQ on the left to activate quotation form.</p>
              </div>
            )}
          </section>
        </div>

        <section className="panel-card">
          <SectionTitle 
            title="Quotation Status" 
            subtitle="Track reviews, approvals, and PO decisions for your submitted bids." 
          />
          <div className="table-responsive">
            <table className="table table-hover align-middle portal-table">
              <thead>
                <tr>
                  <th>Quotation ID</th>
                  <th>RFQ ID</th>
                  <th className="text-end">Amount</th>
                  <th className="text-center">Delivery Days</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myQuotations.map((quote) => {
                  const app = state.approvals.find((a) => a.quotationId === quote.id);
                  const statusText = app ? (app.state === "Approved" ? "Approved" : app.state === "Rejected" ? "Rejected" : "Pending Approval") : "Submitted";
                  const statusTone = statusText === "Approved" ? "success" : statusText === "Rejected" ? "danger" : statusText === "Pending Approval" ? "warning" : "primary";

                  return (
                    <tr key={quote.id}>
                      <td><span className="fw-semibold text-secondary">{quote.id}</span></td>
                      <td>{quote.rfqId}</td>
                      <td className="text-end fw-bold">{formatCurrency(quote.amount)}</td>
                      <td className="text-center">{quote.deliveryDays} days</td>
                      <td>{new Date(quote.submittedAt).toLocaleDateString()}</td>
                      <td><Pill tone={statusTone}>{statusText}</Pill></td>
                    </tr>
                  );
                })}
                {myQuotations.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted p-3">No quotations submitted yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel-card">
          <SectionTitle 
            title="Received Purchase Orders" 
            subtitle="Official contracts issued by the procurement team for execution." 
          />
          <div className="table-responsive">
            <table className="table table-hover align-middle portal-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>RFQ Ref</th>
                  <th>Date Issued</th>
                  <th className="text-end">Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myPurchaseOrders.map((po) => (
                  <tr key={po.id}>
                    <td><span className="fw-semibold text-secondary">{po.id}</span></td>
                    <td>{po.rfqId}</td>
                    <td>{po.issuedAt}</td>
                    <td className="text-end fw-semibold text-success">{formatCurrency(po.amount)}</td>
                    <td><Pill tone={po.status === "Issued" || po.status === "Approved" ? "success" : "warning"}>{po.status}</Pill></td>
                  </tr>
                ))}
                {myPurchaseOrders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted p-3">No purchase orders received yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  };

  const renderManagerDashboard = () => {
    const pendingApprovals = state.approvals.filter((app) => app.state === "Pending");
    const currentApprovalId = activeApprovalId || pendingApprovals[0]?.id;
    const selectedApproval = state.approvals.find((app) => app.id === currentApprovalId);
    const comp = selectedApproval ? getSystemComparison(selectedApproval.rfqId) : null;

    return (
      <div className="d-flex flex-column gap-4">
        <div className="hero-panel py-3 px-4 bg-dark text-white rounded">
          <div>
            <Pill tone="info">Manager Workspace</Pill>
            <h2 className="mt-2">Review pending bids and sign off on purchases.</h2>
            <p className="mb-0 text-white-50">
              Compare vendor commercial terms side-by-side. Approve lowest/recommended offers to generate POs automatically, or reject with comments.
            </p>
          </div>
        </div>

        <div className="portal-grid two-up">
          <section className="panel-card">
            <SectionTitle 
              title={`Pending Approval Queue (${pendingApprovals.length})`} 
              subtitle="Select an item to view comparison reports and sign off." 
            />
            <div className="stack-list">
              {pendingApprovals.map((approval) => (
                <article 
                  key={approval.id} 
                  className={`stack-row cursor-pointer ${selectedApproval?.id === approval.id ? "border-primary bg-primary-subtle" : ""}`}
                  onClick={() => setActiveApprovalId(approval.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="w-100">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="badge bg-warning text-dark small">{approval.requestId}</span>
                      <strong className="text-success">{formatCurrency(approval.amount)}</strong>
                    </div>
                    <h5 className="mb-1 text-dark text-truncate" style={{ fontSize: "0.95rem" }}>{approval.title}</h5>
                    <div className="d-flex justify-content-between text-muted small">
                      <span>RFQ: {approval.rfqId}</span>
                      <span>By: {approval.requester}</span>
                    </div>
                  </div>
                </article>
              ))}
              {pendingApprovals.length === 0 && (
                <div className="p-5 text-center text-muted">
                  <i className="bi bi-check2-circle text-success fs-1 mb-2" />
                  <div>Awesome! No pending approvals in your queue.</div>
                </div>
              )}
            </div>
          </section>

          <section className="panel-card">
            {selectedApproval ? (
              <div className="d-flex flex-column gap-3">
                <div className="border-bottom pb-3">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <span className="badge bg-secondary-subtle text-secondary small uppercase mb-1">{selectedApproval.id}</span>
                      <h3>{selectedApproval.title}</h3>
                      <div className="text-muted small">RFQ Ref: <strong>{selectedApproval.rfqId}</strong> · Requester: {selectedApproval.requester}</div>
                    </div>
                    <div className="text-end">
                      <div className="fs-3 fw-bold text-success">{formatCurrency(selectedApproval.amount)}</div>
                    </div>
                  </div>
                </div>

                {comp ? (
                  <div className="bg-light p-3 rounded border">
                    <h5 className="text-dark mb-3 d-flex align-items-center gap-1">
                      <i className="bi bi-cpu text-primary" /> System Recommendation
                    </h5>
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="bg-white p-2 rounded border border-light">
                          <span className="text-success small fw-semibold block"><i className="bi bi-tag-fill me-1" /> Lowest Price</span>
                          <div className="fw-semibold text-dark text-truncate">{comp.lowestPrice.vendorName}</div>
                          <div className="text-success small">{formatCurrency(comp.lowestPrice.amount)}</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="bg-white p-2 rounded border border-light">
                          <span className="text-info small fw-semibold block"><i className="bi bi-lightning-fill me-1" /> Fastest Delivery</span>
                          <div className="fw-semibold text-dark text-truncate">{comp.fastestDelivery.vendorName}</div>
                          <div className="text-info small">{comp.fastestDelivery.deliveryDays} days</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="bg-white p-2 rounded border border-light">
                          <span className="text-warning small fw-semibold block"><i className="bi bi-star-fill me-1" /> Best Rated</span>
                          <div className="fw-semibold text-dark text-truncate">{comp.bestRated.vendorName}</div>
                          <div className="text-warning small">{comp.bestRated.rating.toFixed(1)} ★</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="bg-primary text-white p-2 rounded">
                          <span className="text-white-50 small fw-semibold block"><i className="bi bi-award-fill me-1" /> Recommended</span>
                          <div className="fw-semibold text-white text-truncate">{comp.recommended.vendorName}</div>
                          <div className="small text-white-50">{formatCurrency(comp.recommended.amount)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-info py-2 small">No quotation entries found to generate system comparisons.</div>
                )}

                <div className="mt-2">
                  <label className="form-label small fw-bold text-secondary">Manager Decision Remarks</label>
                  <textarea
                    className="form-control mb-3"
                    rows="3"
                    placeholder="Enter approval conditions or rejection reasons here..."
                    value={approvalNotes[selectedApproval.id] ?? selectedApproval.remarks ?? ""}
                    onChange={(e) => setApprovalNotes({ ...approvalNotes, [selectedApproval.id]: e.target.value })}
                  />
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-success flex-fill py-2" 
                      onClick={() => {
                        decideApproval(selectedApproval.id, "approved", approvalNotes[selectedApproval.id] ?? selectedApproval.remarks);
                        setActiveApprovalId("");
                        toast.success("Purchase request approved and PO generated.");
                      }}
                    >
                      <i className="bi bi-check-circle me-1" /> Approve
                    </button>
                    <button 
                      className="btn btn-danger flex-fill py-2" 
                      onClick={() => {
                        decideApproval(selectedApproval.id, "rejected", approvalNotes[selectedApproval.id] ?? selectedApproval.remarks);
                        setActiveApprovalId("");
                        toast.success("Purchase request rejected.");
                      }}
                    >
                      <i className="bi bi-x-circle me-1" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted p-5">
                <i className="bi bi-envelope-open fs-1 mb-2" />
                <p>Select a pending approval from the list to view comparison details and take action.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    if (role !== "Admin") {
      return (
        <section className="panel-card">
          <div className="alert alert-danger mb-0">
            <i className="bi bi-exclamation-triangle-fill me-2" />
            Access Denied: You do not have permissions to access platform user management.
          </div>
        </section>
      );
    }
    return (
      <section className="panel-card">
        <SectionTitle title="Platform users" subtitle="Provision users and keep access aligned with role-based workflows." />
        <div className="table-responsive">
          <table className="table table-hover align-middle portal-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Email</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.users.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.role}</td>
                  <td><Pill tone={item.status === "Active" ? "success" : item.status === "Invited" ? "warning" : "danger"}>{item.status}</Pill></td>
                  <td>{item.email}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => toggleUserStatus(item.id)}>
                      Toggle access
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const renderVendors = () => {
    const isProcurementOrManager = role === "Procurement Officer" || role === "Manager";

    const directorySection = (
      <section className="panel-card">
        <SectionTitle 
          title="Vendor Directory" 
          subtitle="Search, filter, and view vendor credentials and status." 
          action={
            <input 
              className="form-control search-input" 
              placeholder="Search by name, category, GST, contact..." 
              value={vendorQuery} 
              onChange={(e) => setVendorQuery(e.target.value)} 
            />
          } 
        />
        <div className="vendor-cards">
          {filteredVendors.map((vendor) => (
            <article key={vendor.id} className="vendor-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <h4 className="mb-0">{vendor.name}</h4>
                    <span className="badge bg-secondary-subtle text-secondary small">ID: {vendor.id}</span>
                  </div>
                  <p className="text-primary fw-medium mb-1">{vendor.category}</p>
                </div>
                <Pill tone={vendor.verified ? "success" : vendor.status === "Pending Review" ? "warning" : "primary"}>
                  {vendor.verified ? "Approved" : vendor.status}
                </Pill>
              </div>
              <div className="vendor-meta mt-2 small text-muted">
                <div><strong>GST:</strong> {vendor.gst}</div>
                <div><strong>Contact:</strong> {vendor.contact}</div>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                <div>
                  <span className="text-muted small">Total Spend: </span>
                  <strong className="text-dark">{formatCurrency(vendor.spend)}</strong>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {!isProcurementOrManager && (
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleVendorStatus(vendor.id)}>
                      Toggle verification
                    </button>
                  )}
                  <span className="vendor-rating">
                    <i className="bi bi-star-fill text-warning me-1" />
                    {(vendor.rating || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </article>
          ))}
          {filteredVendors.length === 0 && (
            <div className="p-4 text-center text-muted col-span-2">
              No vendors found matching your search.
            </div>
          )}
        </div>
      </section>
    );

    if (isProcurementOrManager) {
      return directorySection;
    }

    return (
      <div className="portal-grid two-up">
        <section className="panel-card">
          <SectionTitle title="Register Vendor" subtitle="Capture vendor master data with GST, category, and contact details." />
          <form className="stack-form" onSubmit={submitVendor}>
            <input className="form-control" placeholder="Vendor name" value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} />
            <input className="form-control" placeholder="Category" value={vendorForm.category} onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })} />
            <input className="form-control" placeholder="GST number" value={vendorForm.gst} onChange={(e) => setVendorForm({ ...vendorForm, gst: e.target.value })} />
            <input className="form-control" placeholder="Contact details" value={vendorForm.contact} onChange={(e) => setVendorForm({ ...vendorForm, contact: e.target.value })} />
            <div className="d-flex gap-3">
              <select className="form-select" value={vendorForm.status} onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value })}>
                <option>Pending Review</option>
                <option>Verified</option>
                <option>Shortlisted</option>
              </select>
              <input className="form-control" type="number" step="0.1" min="0" max="5" value={vendorForm.rating} onChange={(e) => setVendorForm({ ...vendorForm, rating: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit">Save vendor</button>
          </form>
        </section>
        {directorySection}
      </div>
    );
  };

  const renderRfq = () => {
    if (role === "Vendor") {
      return (
        <section className="panel-card">
          <SectionTitle title="Assigned RFQs" subtitle="Requests for Quotations assigned to you." />
          <div className="stack-list">
            {assignedRfqs.map((rfq) => (
              <article key={rfq.id} className="stack-row">
                <div className="w-100">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong>{rfq.id}</strong>
                    <Pill tone={rfq.status === "Open" ? "success" : "warning"}>{rfq.status}</Pill>
                  </div>
                  <h4 className="text-dark mb-1">{rfq.title}</h4>
                  <p className="text-muted small mb-2">{rfq.description}</p>
                  <div className="mt-2 bg-light p-2 rounded">
                    <strong>Required Items:</strong>
                    <ul className="mb-0 mt-1 pl-3">
                      {(rfq.items || []).map((item, idx) => (
                        <li key={idx} className="small text-muted">
                          {item.name} - {item.qty} {item.uom}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="small text-muted mt-2">Due {rfq.deadline}</div>
                </div>
              </article>
            ))}
            {assignedRfqs.length === 0 && (
              <div className="text-center text-muted p-4">No RFQs assigned to your vendor account.</div>
            )}
          </div>
        </section>
      );
    }

    const isManager = role === "Manager";
    const filteredAssignmentVendors = state.vendors.filter(v => 
      v.name.toLowerCase().includes(vendorSearch.toLowerCase()) || 
      v.category.toLowerCase().includes(vendorSearch.toLowerCase())
    );

    return (
      <div className="portal-grid two-up">
        {!isManager && (
          <section className="panel-card">
            <SectionTitle title="Create RFQ" subtitle="Add a new request for quotation and assign vendors dynamically." />
            <form className="stack-form" onSubmit={submitRfq}>
              <div className="mb-2">
                <label className="form-label small fw-semibold text-secondary">RFQ Title</label>
                <input className="form-control" placeholder="RFQ title" value={rfqForm.title} onChange={(e) => setRfqForm({ ...rfqForm, title: e.target.value })} required />
              </div>
              <div className="mb-2">
                <label className="form-label small fw-semibold text-secondary">Product/Service Specifications</label>
                <textarea className="form-control" rows="2" placeholder="Details of the request" value={rfqForm.description} onChange={(e) => setRfqForm({ ...rfqForm, description: e.target.value })} required />
              </div>
              <div className="mb-2">
                <label className="form-label small fw-semibold text-secondary">Deadline Date</label>
                <input className="form-control" type="date" value={rfqForm.deadline} onChange={(e) => setRfqForm({ ...rfqForm, deadline: e.target.value })} required />
              </div>

              {/* Database-driven Item Selector */}
              <div className="mb-3 p-3 bg-light rounded border">
                <label className="form-label fw-bold text-dark mb-2"><i className="bi bi-cart-plus me-1 text-primary" /> Select RFQ Items (From DB)</label>
                
                <select className="form-select mb-2" value={selectedItemName} onChange={(e) => {
                  const val = e.target.value;
                  setSelectedItemName(val);
                  const existingItem = existingItems.find(x => x.name === val);
                  if (existingItem) {
                    setItemUom(existingItem.uom || "pcs");
                  }
                }}>
                  <option value="">-- Choose Item from DB --</option>
                  {existingItems.map(item => (
                    <option key={item.name} value={item.name}>{item.name}</option>
                  ))}
                </select>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <input type="number" className="form-control" placeholder="Quantity" min="1" value={itemQty} onChange={(e) => setItemQty(Number(e.target.value))} />
                  </div>
                  <div className="col-6">
                    <input type="text" className="form-control" placeholder="UOM (e.g. pcs)" value={itemUom} onChange={(e) => setItemUom(e.target.value)} />
                  </div>
                </div>

                <button type="button" className="btn btn-outline-secondary btn-sm w-100" onClick={() => {
                  if (!selectedItemName) {
                    toast.error("Please select an item first.");
                    return;
                  }
                  setAddedItems([...addedItems, { name: selectedItemName, qty: itemQty, uom: itemUom }]);
                  setSelectedItemName("");
                  setItemQty(1);
                  setItemUom("pcs");
                }}>
                  <i className="bi bi-plus" /> Add Item
                </button>

                {addedItems.length > 0 && (
                  <table className="table table-sm table-bordered mt-3 bg-white mb-0">
                    <thead>
                      <tr className="small">
                        <th>Item</th>
                        <th className="text-end">Qty</th>
                        <th>UOM</th>
                        <th className="text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addedItems.map((item, idx) => (
                        <tr key={idx} className="small">
                          <td>{item.name}</td>
                          <td className="text-end">{item.qty}</td>
                          <td>{item.uom}</td>
                          <td className="text-center">
                            <button type="button" className="btn btn-link text-danger p-0" onClick={() => setAddedItems(addedItems.filter((_, i) => i !== idx))}>
                              <i className="bi bi-trash" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Database-driven Vendor Picker */}
              <div className="mb-3 p-3 bg-light rounded border">
                <label className="form-label fw-bold text-dark mb-2"><i className="bi bi-people-fill me-1 text-primary" /> Assign Vendors (From DB)</label>
                <input type="text" className="form-control mb-2" placeholder="Filter vendor list..." value={vendorSearch} onChange={(e) => setVendorSearch(e.target.value)} />
                
                <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "10px", padding: "8px", background: "white" }}>
                  {filteredAssignmentVendors.map(vendor => {
                    const isChecked = selectedVendors.includes(vendor.id);
                    return (
                      <div key={vendor.id} className="form-check d-flex align-items-center justify-content-between p-1 border-bottom last-border-0">
                        <div className="d-flex align-items-center">
                          <input 
                            type="checkbox" 
                            className="form-check-input me-2" 
                            id={`chk-${vendor.id}`} 
                            checked={isChecked} 
                            onChange={() => {
                              if (isChecked) {
                                setSelectedVendors(selectedVendors.filter(id => id !== vendor.id));
                              } else {
                                setSelectedVendors([...selectedVendors, vendor.id]);
                              }
                            }} 
                          />
                          <label className="form-check-label small fw-semibold" htmlFor={`chk-${vendor.id}`}>
                            {vendor.name} <span className="text-muted" style={{ fontSize: "0.75rem" }}>({vendor.category})</span>
                          </label>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-warning" style={{ fontSize: "0.75rem" }}><i className="bi bi-star-fill" /> {vendor.rating.toFixed(1)}</span>
                          <span className={`badge ${vendor.status === "Verified" ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"}`} style={{ fontSize: "0.75rem" }}>{vendor.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button className="btn btn-primary w-100 py-2" type="submit"><i className="bi bi-send" /> Publish RFQ</button>
            </form>
          </section>
        )}

        <section className={`panel-card ${isManager ? "vendor-directory-full" : ""}`}>
          <SectionTitle title="Open RFQs" subtitle="Current procurement requests and vendor invitations." />
          <div className="stack-list">
            {state.rfqs.map((rfq) => (
              <article key={rfq.id} className="stack-row">
                <div className="w-100">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong>{rfq.id}</strong>
                    <Pill tone={rfq.status === "Open" ? "success" : "warning"}>{rfq.status}</Pill>
                  </div>
                  <h5 className="mb-1 text-dark">{rfq.title}</h5>
                  <p className="text-muted small mb-2">{rfq.description}</p>
                  <div className="small text-muted">Due {rfq.deadline} · Requester: {rfq.requester}</div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  };

  const renderQuotations = () => {
    if (role === "Vendor") {
      return renderVendorWorkspace();
    }

    const activeRfq = state.rfqs.find((r) => r.id === selectedRfqId);
    const comp = getSystemComparison(selectedRfqId);
    const rfqQuotes = state.quotations.filter((q) => q.rfqId === selectedRfqId);

    return (
      <div className="d-flex flex-column gap-4">
        <section className="panel-card">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3>Quotation Center</h3>
              <p className="text-muted mb-0">Select an RFQ to view submitted quotations and system comparison analytics.</p>
            </div>
            <div>
              <select 
                className="form-select compare-select" 
                style={{ minWidth: "250px" }}
                value={selectedRfqId} 
                onChange={(e) => setSelectedRfqId(e.target.value)}
              >
                <option value="">Select RFQ...</option>
                {state.rfqs.map((rfq) => (
                  <option key={rfq.id} value={rfq.id}>
                    {rfq.id} - {rfq.title} ({rfq.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {activeRfq && (
          <section className="panel-card bg-light border border-light">
            <h4 className="mb-2 text-dark">RFQ Specifications: {activeRfq.id}</h4>
            <p className="text-muted mb-3">{activeRfq.description}</p>
            <h5 className="text-secondary small fw-semibold uppercase tracking-wider mb-2">Required Items</h5>
            <div className="table-responsive bg-white rounded border border-light" style={{ maxWidth: "600px" }}>
              <table className="table table-sm table-borderless align-middle mb-0 px-2 py-1">
                <thead>
                  <tr className="border-bottom text-muted small">
                    <th>Item Name</th>
                    <th className="text-end">Qty</th>
                    <th className="text-center">UOM</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeRfq.items || []).map((item, idx) => (
                    <tr key={idx} className="small">
                      <td><strong>{item.name}</strong></td>
                      <td className="text-end">{item.qty}</td>
                      <td className="text-center">{item.uom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {comp && (
          <section className="panel-card bg-light border-0">
            <h4 className="mb-3 text-dark d-flex align-items-center gap-2">
              <i className="bi bi-cpu text-primary" /> System Comparison Section
            </h4>
            <div className="row g-3">
              <div className="col-12 col-md-6 col-lg-3">
                <div className="card h-100 border-0 shadow-sm p-3 bg-white">
                  <div className="text-success small fw-bold uppercase tracking-wider mb-2">
                    <i className="bi bi-tag-fill me-1" /> Lowest Price
                  </div>
                  <h5 className="mb-1 text-dark">{comp.lowestPrice.vendorName}</h5>
                  <div className="fs-4 fw-bold text-success mb-1">{formatCurrency(comp.lowestPrice.amount)}</div>
                  <div className="text-muted small">Delivery: {comp.lowestPrice.deliveryDays} days</div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="card h-100 border-0 shadow-sm p-3 bg-white">
                  <div className="text-info small fw-bold uppercase tracking-wider mb-2">
                    <i className="bi bi-lightning-fill me-1" /> Fastest Delivery
                  </div>
                  <h5 className="mb-1 text-dark">{comp.fastestDelivery.vendorName}</h5>
                  <div className="fs-4 fw-bold text-info mb-1">{comp.fastestDelivery.deliveryDays} Days</div>
                  <div className="text-muted small">Price: {formatCurrency(comp.fastestDelivery.amount)}</div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="card h-100 border-0 shadow-sm p-3 bg-white">
                  <div className="text-warning small fw-bold uppercase tracking-wider mb-2">
                    <i className="bi bi-star-fill me-1" /> Best Rated Vendor
                  </div>
                  <h5 className="mb-1 text-dark">{comp.bestRated.vendorName}</h5>
                  <div className="fs-4 fw-bold text-warning mb-1">
                    <i className="bi bi-star-fill me-1" />{comp.bestRated.rating.toFixed(1)}
                  </div>
                  <div className="text-muted small">Price: {formatCurrency(comp.bestRated.amount)}</div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="card h-100 border-0 shadow-sm p-3 bg-primary text-white">
                  <div className="text-white-50 small fw-bold uppercase tracking-wider mb-2">
                    <i className="bi bi-award-fill me-1" /> Recommended Vendor
                  </div>
                  <h5 className="mb-1 text-white">{comp.recommended.vendorName}</h5>
                  <div className="fs-4 fw-bold mb-1">{formatCurrency(comp.recommended.amount)}</div>
                  <div className="text-white-50 small">Automated recommendation based on lowest bid</div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="panel-card">
          <SectionTitle 
            title={`Submitted Bids (${rfqQuotes.length})`} 
            subtitle="Review responses submitted by verified vendors for this RFQ." 
          />
          <div className="table-responsive">
            <table className="table table-hover align-middle portal-table">
              <thead>
                <tr>
                  <th>RFQ Number</th>
                  <th>Vendor Name</th>
                  <th className="text-end">Quotation Amount</th>
                  <th className="text-center">Delivery Days</th>
                  <th className="text-center">Vendor Rating</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rfqQuotes.map((quote) => {
                  const app = state.approvals.find((a) => a.quotationId === quote.id);
                  const statusText = app ? (app.state === "Approved" ? "Approved" : app.state === "Rejected" ? "Rejected" : "Pending Approval") : "Submitted";
                  const statusTone = statusText === "Approved" ? "success" : statusText === "Rejected" ? "danger" : statusText === "Pending Approval" ? "warning" : "primary";

                  return (
                    <tr key={quote.id}>
                      <td><span className="fw-semibold text-secondary">{quote.rfqId}</span></td>
                      <td>
                        <strong>{quote.vendorName}</strong>
                        {quote.notes ? <p className="text-muted small mb-0 mt-1">Note: {quote.notes}</p> : null}
                      </td>
                      <td className="text-end fw-bold text-success">{formatCurrency(quote.amount)}</td>
                      <td className="text-center">{quote.deliveryDays} days</td>
                      <td className="text-center">
                        <span className="badge bg-warning-subtle text-warning border-0">
                          <i className="bi bi-star-fill me-1" />{(quote.rating || 0).toFixed(1)}
                        </span>
                      </td>
                      <td>{quote.submittedAt ? new Date(quote.submittedAt).toLocaleDateString() : "N/A"}</td>
                      <td><Pill tone={statusTone}>{statusText}</Pill></td>
                    </tr>
                  );
                })}
                {rfqQuotes.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-muted p-4">
                      {selectedRfqId ? "No quotations received yet for this RFQ." : "Please select an RFQ from the dropdown to see quotations."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  };

  const renderApprovals = () => {
    const isManager = role === "Manager";

    if (isManager) {
      return (
        <section className="panel-card">
          <SectionTitle title="Manager Approval Queue" subtitle="Review pending vendor bids, compare system analytics, and approve/reject with remarks." />
          <div className="approval-list">
            {state.approvals.map((approval) => {
              const comp = getSystemComparison(approval.rfqId);
              return (
                <article key={approval.id} className="approval-card border-start border-4 border-warning p-4 mb-4 bg-white rounded shadow-sm">
                  <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                    <div>
                      <span className="badge bg-warning text-dark uppercase tracking-wider mb-2">{approval.requestId}</span>
                      <h4 className="mb-1 text-dark">{approval.title}</h4>
                      <p className="text-muted small mb-0">Requester: {approval.requester} · Level: {approval.level}</p>
                    </div>
                    <div className="text-end">
                      <div className="fs-4 fw-bold text-success mb-1">{formatCurrency(approval.amount)}</div>
                      <Pill tone={approval.state === "Pending" ? "warning" : approval.state === "Approved" ? "success" : "danger"}>{approval.state}</Pill>
                    </div>
                  </div>

                  {comp && (
                    <div className="bg-light p-3 rounded my-3 border border-light">
                      <div className="text-secondary small fw-semibold mb-2">
                        <i className="bi bi-cpu-fill text-primary me-1" /> SYSTEM COMPARISON FOR {approval.rfqId}
                      </div>
                      <div className="row g-2">
                        <div className="col-12 col-sm-6 col-md-3">
                          <div className="bg-white p-2 rounded border border-light">
                            <span className="text-success small block fw-bold"><i className="bi bi-tag-fill me-1" /> Lowest Bid</span>
                            <div className="fw-semibold text-dark truncate">{comp.lowestPrice.vendorName}</div>
                            <div className="text-success small">{formatCurrency(comp.lowestPrice.amount)}</div>
                          </div>
                        </div>
                        <div className="col-12 col-sm-6 col-md-3">
                          <div className="bg-white p-2 rounded border border-light">
                            <span className="text-info small block fw-bold"><i className="bi bi-lightning-fill me-1" /> Fastest</span>
                            <div className="fw-semibold text-dark truncate">{comp.fastestDelivery.vendorName}</div>
                            <div className="text-info small">{comp.fastestDelivery.deliveryDays} days</div>
                          </div>
                        </div>
                        <div className="col-12 col-sm-6 col-md-3">
                          <div className="bg-white p-2 rounded border border-light">
                            <span className="text-warning small block fw-bold"><i className="bi bi-star-fill me-1" /> Best Rated</span>
                            <div className="fw-semibold text-dark truncate">{comp.bestRated.vendorName}</div>
                            <div className="text-warning small">{comp.bestRated.rating.toFixed(1)} ★</div>
                          </div>
                        </div>
                        <div className="col-12 col-sm-6 col-md-3">
                          <div className="bg-primary text-white p-2 rounded">
                            <span className="text-white-50 small block fw-bold"><i className="bi bi-award-fill me-1" /> Recommended</span>
                            <div className="fw-semibold text-white truncate">{comp.recommended.vendorName}</div>
                            <div className="small text-white-50">{formatCurrency(comp.recommended.amount)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {approval.state === "Pending" ? (
                    <div className="mt-3">
                      <label className="form-label small fw-semibold text-secondary">Decision Remarks</label>
                      <textarea 
                        className="form-control mb-3" 
                        rows="2" 
                        placeholder="Add professional feedback or approval/rejection remarks here..." 
                        value={approvalNotes[approval.id] ?? approval.remarks ?? ""} 
                        onChange={(e) => setApprovalNotes({ ...approvalNotes, [approval.id]: e.target.value })} 
                      />
                      <div className="d-flex gap-2">
                        <button className="btn btn-success btn-sm px-3" onClick={() => decideApproval(approval.id, "approved", approvalNotes[approval.id] ?? approval.remarks)}>
                          <i className="bi bi-check-circle me-1" /> Approve
                        </button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => decideApproval(approval.id, "rejected", approvalNotes[approval.id] ?? approval.remarks)}>
                          <i className="bi bi-x-circle me-1" /> Reject
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-light p-3 rounded mt-3 text-dark small border-start border-dark border-3">
                      <strong>Decision Remarks:</strong> {approval.remarks || "No remarks provided."}
                    </div>
                  )}

                  <div className="approval-timeline mt-3 pt-2 border-top border-light d-flex gap-3 text-muted small">
                    {approval.timeline.map((item, idx) => (
                      <span key={idx}><i className="bi bi-clock me-1" />{item.label}: {item.at}</span>
                    ))}
                  </div>
                </article>
              );
            })}
            {state.approvals.length === 0 && (
              <div className="text-center text-muted p-5">
                No approvals in queue.
              </div>
            )}
          </div>
        </section>
      );
    }

    return (
      <section className="panel-card">
        <SectionTitle title="Approval Tracking Page" subtitle="Monitor the verification and commercial sign-off status of procurement requests." />
        <div className="table-responsive">
          <table className="table table-hover align-middle portal-table">
            <thead>
              <tr>
                <th>RFQ</th>
                <th>Request ID</th>
                <th>Title</th>
                <th>Vendor</th>
                <th className="text-end">Amount</th>
                <th>Submitted Date</th>
                <th>Current Approver</th>
                <th>Approval Status</th>
              </tr>
            </thead>
            <tbody>
              {state.approvals.map((approval) => {
                const quote = state.quotations.find((q) => q.id === approval.quotationId);
                const vendorName = quote ? quote.vendorName : "Unknown Vendor";
                const createdTime = approval.timeline.find((t) => t.label === "Created")?.at || "N/A";
                
                const statusText = approval.state === "Pending" ? "Pending Approval" : approval.state;
                const statusTone = approval.state === "Pending" ? "warning" : approval.state === "Approved" ? "success" : "danger";

                return (
                  <tr key={approval.id}>
                    <td><span className="fw-semibold text-secondary">{approval.rfqId || "N/A"}</span></td>
                    <td><span className="badge bg-secondary-subtle text-secondary">{approval.requestId}</span></td>
                    <td>
                      <strong>{approval.title}</strong>
                      {approval.remarks ? <p className="text-muted small mb-0 mt-1">Remarks: {approval.remarks}</p> : null}
                    </td>
                    <td>{vendorName}</td>
                    <td className="text-end fw-semibold">{formatCurrency(approval.amount)}</td>
                    <td>{createdTime}</td>
                    <td><span className="text-primary fw-medium">{approval.level || "Manager"}</span></td>
                    <td><Pill tone={statusTone}>{statusText}</Pill></td>
                  </tr>
                );
              })}
              {state.approvals.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-muted p-4">
                    No approval requests tracked in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const renderOrders = () => {
    if (role === "Vendor") {
      if (!currentVendor) return null;
      const myPurchaseOrders = state.purchaseOrders.filter(
        (po) => po.vendorName.toLowerCase() === currentVendor.name.toLowerCase()
      );
      const myInvoices = state.invoices.filter(
        (inv) => inv.vendorName.toLowerCase() === currentVendor.name.toLowerCase()
      );

      return (
        <div className="portal-grid two-up">
          <section className="panel-card">
            <SectionTitle title="Purchase Orders" subtitle="Contracts issued to you." />
            <div className="table-responsive">
              <table className="table table-hover align-middle portal-table">
                <thead>
                  <tr>
                    <th>PO ID</th>
                    <th>RFQ Ref</th>
                    <th>Date Issued</th>
                    <th className="text-end">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myPurchaseOrders.map((po) => (
                    <tr key={po.id}>
                      <td><strong>{po.id}</strong></td>
                      <td>{po.rfqId}</td>
                      <td>{po.issuedAt}</td>
                      <td className="text-end fw-semibold">{formatCurrency(po.amount)}</td>
                      <td><Pill tone="success">{po.status}</Pill></td>
                    </tr>
                  ))}
                  {myPurchaseOrders.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted p-3">No purchase orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel-card">
            <SectionTitle title="Invoices" subtitle="Billing documents." />
            <div className="table-responsive">
              <table className="table table-hover align-middle portal-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>PO ID</th>
                    <th className="text-end">Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td><strong>{inv.id}</strong></td>
                      <td>{inv.poId}</td>
                      <td className="text-end fw-semibold">{formatCurrency(inv.total)}</td>
                      <td><Pill tone={inv.status === "Emailed" ? "success" : "primary"}>{inv.status}</Pill></td>
                    </tr>
                  ))}
                  {myInvoices.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center text-muted p-3">No invoices found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      );
    }

    const isProcurementOfficer = role === "Procurement Officer";

    return (
      <div className="portal-grid two-up">
        <div className="d-flex flex-column gap-4">
          {isProcurementOfficer && (
            <section className="panel-card">
              <SectionTitle title="Generate Purchase Order" subtitle="Select an approved quotation to generate a PO." />
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">Approved Quotation</label>
                <select
                  className="form-select"
                  value={selectedQtnIdForPO}
                  onChange={(e) => setSelectedQtnIdForPO(e.target.value)}
                >
                  <option value="">-- Choose Approved Quotation --</option>
                  {approvedQuotations.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.id} - {q.vendorName} ({formatCurrency(q.amount)})
                    </option>
                  ))}
                </select>
              </div>
              {activeQtnForPO && (
                <div className="bg-light p-3 rounded border mb-3">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <span className="text-secondary small fw-semibold">Vendor</span>
                      <div className="fw-bold text-dark">{activeQtnForPO.vendorName}</div>
                    </div>
                    <div className="col-md-6">
                      <span className="text-secondary small fw-semibold">RFQ Reference</span>
                      <div className="fw-bold text-dark">{activeQtnForPO.rfqId}</div>
                    </div>
                    <div className="col-md-6">
                      <span className="text-secondary small fw-semibold">Amount</span>
                      <div className="fw-bold text-success">{formatCurrency(activeQtnForPO.amount)}</div>
                    </div>
                    <div className="col-md-6">
                      <span className="text-secondary small fw-semibold">Delivery Timeline</span>
                      <div className="fw-bold text-dark">{activeQtnForPO.deliveryDays} Days</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-secondary small fw-semibold">Item List</span>
                    <div className="table-responsive bg-white rounded border border-light mt-1">
                      <table className="table table-sm table-borderless align-middle mb-0 px-2 py-1">
                        <thead>
                          <tr className="border-bottom text-muted small">
                            <th>Item Name</th>
                            <th className="text-end">Qty</th>
                            <th className="text-center">UOM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(state.rfqs.find(r => r.id === activeQtnForPO.rfqId)?.items || []).map((item, idx) => (
                            <tr key={idx} className="small">
                              <td><strong>{item.name}</strong></td>
                              <td className="text-end">{item.qty}</td>
                              <td className="text-center">{item.uom}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary w-100 mt-3"
                    onClick={() => handleGeneratePO(activeQtnForPO.id)}
                  >
                    <i className="bi bi-file-earmark-plus me-1" /> Generate Purchase Order
                  </button>
                </div>
              )}
            </section>
          )}

          <section className="panel-card">
            <SectionTitle title="Purchase orders" subtitle="Track purchase order status." />
            <div className="stack-list">
              {state.purchaseOrders.map((po) => (
                <article key={po.id} className="stack-row compact">
                  <div>
                    <strong>{po.id}</strong>
                    <p>{po.vendorName}</p>
                    <small>{po.rfqId}</small>
                  </div>
                  <div className="text-end">
                    <strong>{formatCurrency(po.amount)}</strong>
                    <div><Pill tone={po.status === "Issued" ? "success" : "warning"}>{po.status}</Pill></div>
                  </div>
                </article>
              ))}
              {state.purchaseOrders.length === 0 && (
                <div className="text-center text-muted p-3">No purchase orders generated yet.</div>
              )}
            </div>
          </section>
        </div>

        <section className="panel-card invoice-panel">
          <SectionTitle title="Invoice workspace" subtitle="Preview, print, and email invoice documents." action={<select className="form-select compare-select" value={selectedPo?.id || ""} onChange={(e) => setSelectedPoId(e.target.value)}>{state.purchaseOrders.map((po) => <option key={po.id} value={po.id}>{po.id}</option>)}</select>} />
          {selectedPo ? (
            <div className="invoice-sheet">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h4>{selectedInvoice?.id || `INV pending for ${selectedPo.id}`}</h4>
                  <div className="text-muted">VendorBridge ERP invoice preview</div>
                </div>
                <Pill tone={selectedInvoice?.status === "Emailed" ? "success" : "primary"}>{selectedInvoice?.status || "Draft"}</Pill>
              </div>
              <div className="invoice-grid">
                <div><span>PO</span><strong>{selectedPo.id}</strong></div>
                <div><span>Vendor</span><strong>{selectedPo.vendorName}</strong></div>
                <div><span>Subtotal</span><strong>{formatCurrency(selectedInvoice?.subtotal || selectedPo.amount)}</strong></div>
                <div><span>Tax</span><strong>{selectedPo.taxPercent}%</strong></div>
                <div><span>Total</span><strong>{formatCurrency(selectedInvoice?.total || Math.round(selectedPo.amount * 1.18))}</strong></div>
                <div><span>Email</span><strong>{selectedInvoice?.recipient || selectedPo.contactEmail}</strong></div>
              </div>

              <div className="mt-3 mb-3">
                <span className="text-secondary small fw-semibold">Invoice Items</span>
                <div className="table-responsive bg-white rounded border border-light mt-1">
                  <table className="table table-sm table-borderless align-middle mb-0 px-2 py-1">
                    <thead>
                      <tr className="border-bottom text-muted small">
                        <th>Item Name</th>
                        <th className="text-end">Qty</th>
                        <th className="text-center">UOM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(state.rfqs.find(r => r.id === selectedPo.rfqId)?.items || []).map((item, idx) => (
                        <tr key={idx} className="small">
                          <td><strong>{item.name}</strong></td>
                          <td className="text-end">{item.qty}</td>
                          <td className="text-center">{item.uom}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="d-flex gap-2 flex-wrap mt-4">
                <button className="btn btn-primary" onClick={printInvoice}>Print / Save PDF</button>
                <button className="btn btn-outline-primary" onClick={() => emailInvoice(selectedInvoice || { ...selectedPo, id: `INV-${selectedPo.id}`, total: Math.round(selectedPo.amount * 1.18), recipient: selectedPo.contactEmail })}>Send through email</button>
                <button className="btn btn-outline-secondary" onClick={() => generateInvoiceFromPo(selectedPo.id)}>Generate invoice</button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted p-4">
              Select a purchase order to open the invoice workspace.
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderActivity = () => (
    <section className="panel-card">
      <SectionTitle title="Activity stream" subtitle="Audit trail of procurement events and notifications." />
      <div className="timeline-list wide">
        {state.activities.map((item) => (
          <div key={item.id} className="timeline-item">
            <div className={`timeline-dot ${item.tone}`} />
            <div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
            <span>{item.time}</span>
          </div>
        ))}
      </div>
    </section>
  );

  const renderReports = () => (
    <>
      <div className="metric-grid">
        <MetricCard label="Procurement spend" value={formatCurrency(summary.monthlySpend)} hint="Year-to-date spend" icon="bi-currency-rupee" accent="primary" />
        <MetricCard label="Vendor coverage" value={`${summary.verifiedVendors}/${state.vendors.length}`} hint="Verified supplier pool" icon="bi-building" accent="success" />
        <MetricCard label="Approval backlog" value={summary.pendingApprovals} hint="Pending decisions" icon="bi-clipboard-data" accent="warning" />
        <MetricCard label="Monthly RFQs" value={state.rfqs.length} hint="Tracked requests" icon="bi-file-earmark-text" accent="info" />
      </div>

      <div className="portal-grid two-up mt-4">
        <section className="panel-card">
          <SectionTitle title="Monthly procurement trend" subtitle="Simple spend chart without leaving the page." />
          <div className="trend-chart">
            {state.monthlyTrend.map((point) => (
              <div key={point.month} className="trend-bar">
                <div className="trend-fill" style={{ height: `${Math.max(20, (point.spend / 65000) * 100)}%` }} />
                <span>{point.month}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-card">
          <SectionTitle title="Exportable reports" subtitle="Download CSV snapshots for vendors or RFQ spend." />
          <div className="d-grid gap-2">
            <button className="btn btn-outline-primary" onClick={() => exportCsv("vendors-report.csv", state.vendors.map(({ id, name, category, status, spend }) => ({ id, name, category, status, spend }))) }>
              Export vendor report
            </button>
            <button className="btn btn-outline-primary" onClick={() => exportCsv("rfq-report.csv", state.rfqs.map(({ id, title, status, deadline, requester }) => ({ id, title, status, deadline, requester }))) }>
              Export RFQ report
            </button>
            <button className="btn btn-outline-primary" onClick={() => exportCsv("invoice-report.csv", state.invoices.map(({ id, poId, vendorName, total, status }) => ({ id, poId, vendorName, total, status }))) }>
              Export invoice report
            </button>
          </div>
        </section>
      </div>
    </>
  );;

  const contentByView = {
    dashboard: renderDashboard(),
    users: renderUsers(),
    vendors: renderVendors(),
    rfq: renderRfq(),
    quotations: renderQuotations(),
    approvals: renderApprovals(),
    orders: renderOrders(),
    activity: renderActivity(),
    reports: renderReports(),
  };

  return (
    <PortalShell
      user={user}
      navItems={navItems}
      title={config.title}
      subtitle={config.subtitle}
      onLogout={handleLogout}
    >
      {contentByView[view] || contentByView.dashboard}
    </PortalShell>
  );
};

export default PortalPage;
