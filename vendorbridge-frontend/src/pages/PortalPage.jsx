import React, { useMemo, useState } from "react";
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
  const { state, summary, toggleUserStatus, upsertVendor, toggleVendorStatus, createRfq, submitQuotation, decideApproval, generatePurchaseOrderFromQuotation, generateInvoiceFromPo, markInvoiceEmailed } = useProcurementPortal();
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : { fullName: `${role} Portal`, role };

  const [vendorQuery, setVendorQuery] = useState("");
  const [vendorForm, setVendorForm] = useState({ name: "", category: "", gst: "", contact: "", status: "Pending Review", verified: false, rating: "4.4", spend: "0" });
  const [rfqForm, setRfqForm] = useState({ title: "", description: "", deadline: "", vendors: "", requester: user.fullName || role, items: "" });
  const [quotationForm, setQuotationForm] = useState({ rfqId: state.rfqs[0]?.id || "", vendorId: state.vendors[0]?.id || "", amount: "", deliveryDays: "", notes: "", rating: "4.5" });
  const [approvalNotes, setApprovalNotes] = useState({});
  const [selectedRfqId, setSelectedRfqId] = useState(state.rfqs[0]?.id || "");
  const [selectedPoId, setSelectedPoId] = useState(state.purchaseOrders[0]?.id || "");

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
    createRfq({
      title: rfqForm.title,
      description: rfqForm.description,
      deadline: rfqForm.deadline,
      requester: rfqForm.requester,
      vendorIds: rfqForm.vendors.split(",").map((item) => item.trim()).filter(Boolean),
      items: rfqForm.items
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const [name, qty, uom] = item.split("|").map((part) => part.trim());
          return { name, qty: Number(qty || 1), uom: uom || "unit" };
        }),
    });
    toast.success("RFQ created and added to the active queue.");
    setRfqForm({ title: "", description: "", deadline: "", vendors: "", requester: user.fullName || role, items: "" });
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

  const renderDashboard = () => (
    <>
      <div className="hero-panel">
        <div>
          <Pill tone="info">Role: {role}</Pill>
          <h2>{role === "Vendor" ? "Respond to RFQs and track purchase orders." : "Run procurement from RFQ to invoice in one controlled workspace."}</h2>
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

  const renderUsers = () => (
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

  const renderVendors = () => (
    <div className="portal-grid two-up">
      <section className="panel-card">
        <SectionTitle title="Register vendor" subtitle="Capture vendor master data with GST, category, and contact details." />
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

      <section className="panel-card">
        <SectionTitle title="Vendor directory" subtitle="Search, filter, and manage vendor status." action={<input className="form-control search-input" placeholder="Search vendors" value={vendorQuery} onChange={(e) => setVendorQuery(e.target.value)} />} />
        <div className="vendor-cards">
          {filteredVendors.map((vendor) => (
            <article key={vendor.id} className="vendor-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h4>{vendor.name}</h4>
                  <p>{vendor.category}</p>
                </div>
                <Pill tone={vendor.verified ? "success" : vendor.status === "Pending Review" ? "warning" : "primary"}>{vendor.status}</Pill>
              </div>
              <div className="vendor-meta">GST: {vendor.gst}</div>
              <div className="vendor-meta">{vendor.contact}</div>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <strong>{formatCurrency(vendor.spend)}</strong>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleVendorStatus(vendor.id)}>Toggle verification</button>
                  <span className="vendor-rating"><i className="bi bi-star-fill me-1" />{vendor.rating.toFixed(1)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderRfq = () => (
    <div className="portal-grid two-up">
      <section className="panel-card">
        <SectionTitle title="Create RFQ" subtitle="Add a new request for quotation and select vendors to invite." />
        <form className="stack-form" onSubmit={submitRfq}>
          <input className="form-control" placeholder="RFQ title" value={rfqForm.title} onChange={(e) => setRfqForm({ ...rfqForm, title: e.target.value })} />
          <textarea className="form-control" rows="3" placeholder="Product or service details" value={rfqForm.description} onChange={(e) => setRfqForm({ ...rfqForm, description: e.target.value })} />
          <div className="d-flex gap-3">
            <input className="form-control" type="date" value={rfqForm.deadline} onChange={(e) => setRfqForm({ ...rfqForm, deadline: e.target.value })} />
            <input className="form-control" placeholder="Vendor IDs separated by commas" value={rfqForm.vendors} onChange={(e) => setRfqForm({ ...rfqForm, vendors: e.target.value })} />
          </div>
          <textarea className="form-control" rows="3" placeholder="Items using name|qty|uom; separated by semicolons" value={rfqForm.items} onChange={(e) => setRfqForm({ ...rfqForm, items: e.target.value })} />
          <button className="btn btn-primary" type="submit">Publish RFQ</button>
        </form>
      </section>

      <section className="panel-card">
        <SectionTitle title="Open RFQs" subtitle="Current procurement requests and vendor invitations." />
        <div className="stack-list">
          {state.rfqs.map((rfq) => (
            <article key={rfq.id} className="stack-row">
              <div>
                <strong>{rfq.id}</strong>
                <p>{rfq.title}</p>
                <small>{rfq.description}</small>
              </div>
              <div className="text-end">
                <Pill tone={rfq.status === "Open" ? "success" : "warning"}>{rfq.status}</Pill>
                <div className="small text-muted mt-1">Due {rfq.deadline}</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderQuotations = () => (
    <div className="portal-grid two-up">
      <section className="panel-card">
        <SectionTitle title="Submit quotation" subtitle="Vendor response form with editable commercial terms." />
        <form className="stack-form" onSubmit={submitQuote}>
          <select className="form-select" value={quotationForm.rfqId} onChange={(e) => setQuotationForm({ ...quotationForm, rfqId: e.target.value })}>
            {state.rfqs.map((rfq) => <option key={rfq.id} value={rfq.id}>{rfq.id} - {rfq.title}</option>)}
          </select>
          <select className="form-select" value={quotationForm.vendorId} onChange={(e) => setQuotationForm({ ...quotationForm, vendorId: e.target.value })}>
            {state.vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
          </select>
          <div className="d-flex gap-3">
            <input className="form-control" type="number" placeholder="Amount" value={quotationForm.amount} onChange={(e) => setQuotationForm({ ...quotationForm, amount: e.target.value })} />
            <input className="form-control" type="number" placeholder="Delivery days" value={quotationForm.deliveryDays} onChange={(e) => setQuotationForm({ ...quotationForm, deliveryDays: e.target.value })} />
          </div>
          <textarea className="form-control" rows="3" placeholder="Notes or comments" value={quotationForm.notes} onChange={(e) => setQuotationForm({ ...quotationForm, notes: e.target.value })} />
          <input className="form-control" type="number" step="0.1" min="0" max="5" value={quotationForm.rating} onChange={(e) => setQuotationForm({ ...quotationForm, rating: e.target.value })} />
          <button className="btn btn-primary" type="submit">Submit quotation</button>
        </form>
      </section>

      <section className="panel-card">
        <SectionTitle title="Quotation comparison" subtitle="Side-by-side pricing, delivery, and vendor rating analysis." action={<select className="form-select compare-select" value={selectedRfqId} onChange={(e) => setSelectedRfqId(e.target.value)}>{state.rfqs.map((rfq) => <option key={rfq.id} value={rfq.id}>{rfq.id}</option>)}</select>} />
        <div className="comparison-table">
          {comparisonQuotes.map((quote) => (
            <article key={quote.id} className={`comparison-card ${lowestQuote?.id === quote.id ? "best" : ""}`}>
              <div className="d-flex justify-content-between">
                <div>
                  <strong>{quote.vendorName}</strong>
                  <p>{quote.rfqId}</p>
                </div>
                {lowestQuote?.id === quote.id ? <Pill tone="success">Lowest price</Pill> : <Pill tone="primary">Comparable</Pill>}
              </div>
              <div className="comparison-stats">
                <span><i className="bi bi-cash-coin me-1" />{formatCurrency(quote.amount)}</span>
                <span><i className="bi bi-truck me-1" />{quote.deliveryDays} days</span>
                <span><i className="bi bi-star-fill me-1" />{quote.rating.toFixed(1)}</span>
              </div>
              <small>{quote.notes}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderApprovals = () => (
    <section className="panel-card">
      <SectionTitle title="Approval queue" subtitle="Approve or reject procurement requests with remarks and timeline context." />
      <div className="approval-list">
        {state.approvals.map((approval) => (
          <article key={approval.id} className="approval-card">
            <div className="d-flex justify-content-between align-items-start gap-3">
              <div>
                <strong>{approval.requestId}</strong>
                <p>{approval.title}</p>
                <small>Requester: {approval.requester}</small>
              </div>
              <Pill tone={approval.state === "Pending" ? "warning" : approval.state === "Approved" ? "success" : "danger"}>{approval.state}</Pill>
            </div>
            <div className="approval-meta">
              <span>{formatCurrency(approval.amount)}</span>
              <span>Current level: {approval.level}</span>
            </div>
            <textarea className="form-control my-3" rows="2" placeholder="Approval remarks" value={approvalNotes[approval.id] ?? approval.remarks} onChange={(e) => setApprovalNotes({ ...approvalNotes, [approval.id]: e.target.value })} />
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-success btn-sm" onClick={() => decideApproval(approval.id, "approved", approvalNotes[approval.id] ?? approval.remarks)}>Approve</button>
              <button className="btn btn-outline-danger btn-sm" onClick={() => decideApproval(approval.id, "rejected", approvalNotes[approval.id] ?? approval.remarks)}>Reject</button>
            </div>
            <div className="approval-timeline">
              {approval.timeline.map((item) => <span key={item.label}>{item.label} · {item.at}</span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  const renderOrders = () => (
    <div className="portal-grid two-up">
      <section className="panel-card">
        <SectionTitle title="Purchase orders" subtitle="Generate, issue, and track purchase order progress." />
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
        </div>
      </section>

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
            <div className="d-flex gap-2 flex-wrap mt-4">
              <button className="btn btn-primary" onClick={printInvoice}>Print / Save PDF</button>
              <button className="btn btn-outline-primary" onClick={() => emailInvoice(selectedInvoice || { ...selectedPo, id: `INV-${selectedPo.id}`, total: Math.round(selectedPo.amount * 1.18), recipient: selectedPo.contactEmail })}>Send through email</button>
              <button className="btn btn-outline-secondary" onClick={() => generateInvoiceFromPo(selectedPo.id)}>Generate invoice</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );

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
  );

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
