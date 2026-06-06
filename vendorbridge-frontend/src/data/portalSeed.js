const createId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const navByRole = {
  Admin: [
    { label: "Overview", path: "/admin/dashboard" },
    { label: "Users", path: "/admin/users" },
    { label: "Vendors", path: "/admin/vendors" },
    { label: "Reports", path: "/admin/reports" },
    { label: "Activity", path: "/admin/activity" },
  ],
  "Procurement Officer": [
    { label: "Overview", path: "/procurement/dashboard" },
    { label: "Vendors", path: "/procurement/vendors" },
    { label: "RFQs", path: "/procurement/rfq" },
    { label: "Quotations", path: "/procurement/quotations" },
    { label: "Approvals", path: "/procurement/approvals" },
    { label: "Orders & Invoices", path: "/procurement/orders" },
    { label: "Activity", path: "/procurement/activity" },
    { label: "Reports", path: "/procurement/reports" },
  ],
  Vendor: [
    { label: "Overview", path: "/vendor/dashboard" },
    { label: "RFQs", path: "/vendor/rfqs" },
    { label: "Quotations", path: "/vendor/quotations" },
    { label: "Purchase Orders", path: "/vendor/orders" },
    { label: "Activity", path: "/vendor/activity" },
  ],
  Manager: [
    { label: "Overview", path: "/manager/dashboard" },
    { label: "Approvals", path: "/manager/approvals" },
    { label: "Activity", path: "/manager/activity" },
    { label: "Reports", path: "/manager/reports" },
  ],
};

const vendors = [
  {
    id: createId("VND"),
    name: "Acme Corporation",
    category: "IT Hardware",
    gst: "29ABCDE1234F1Z5",
    contact: "billing@acme.com | +91 98765 43210",
    status: "Verified",
    rating: 4.8,
    verified: true,
    spend: 215000,
  },
  {
    id: createId("VND"),
    name: "Metro Office Supplies",
    category: "Office Supplies",
    gst: "27QWERT1234R1Z3",
    contact: "sales@metrooffice.in | +91 99887 77665",
    status: "Shortlisted",
    rating: 4.5,
    verified: false,
    spend: 84000,
  },
  {
    id: createId("VND"),
    name: "Nimbus Logistics",
    category: "Logistics",
    gst: "24NIMBU1234L1Z6",
    contact: "ops@nimbuslogistics.com | +91 98111 22334",
    status: "Verified",
    rating: 4.7,
    verified: true,
    spend: 141000,
  },
  {
    id: createId("VND"),
    name: "BrightEdge Services",
    category: "Facilities",
    gst: "07BRIGH1234E1Z8",
    contact: "hello@brightedge.co | +91 99001 22345",
    status: "Pending Review",
    rating: 4.2,
    verified: false,
    spend: 62000,
  },
];

const users = [
  { id: createId("USR"), name: "Asha Mehta", email: "asha@vendorbridge.com", role: "Procurement Officer", status: "Active" },
  { id: createId("USR"), name: "Ravi Sharma", email: "ravi@vendorbridge.com", role: "Manager", status: "Active" },
  { id: createId("USR"), name: "Acme Corporation", email: "billing@acme.com", role: "Vendor", status: "Active" },
  { id: createId("USR"), name: "Northwind Traders", email: "northwind@supply.com", role: "Vendor", status: "Invited" },
];

const rfqs = [
  {
    id: "RFQ-2026-104",
    title: "Server Racks & Cat6 Cabling",
    description: "Procurement of 24U server racks, structured cabling, and installation support.",
    deadline: "2026-06-15",
    vendorIds: [vendors[0].id, vendors[1].id, vendors[2].id],
    status: "Open",
    requester: "Asha Mehta",
    items: [
      { name: "24U Rack", qty: 3, uom: "pcs" },
      { name: "Cat6 Cabling", qty: 1200, uom: "meters" },
    ],
  },
  {
    id: "RFQ-2026-118",
    title: "Office Consumables Quarterly",
    description: "Quarterly procurement for stationery, print paper, and desk supplies.",
    deadline: "2026-06-12",
    vendorIds: [vendors[1].id, vendors[3].id],
    status: "Reviewing",
    requester: "Ravi Sharma",
    items: [
      { name: "A4 Paper", qty: 400, uom: "reams" },
      { name: "Stationery Kits", qty: 120, uom: "kits" },
    ],
  },
  {
    id: "RFQ-2026-121",
    title: "Facility Maintenance Services",
    description: "Annual contract for HVAC, housekeeping, and facility upkeep.",
    deadline: "2026-06-20",
    vendorIds: [vendors[2].id, vendors[3].id],
    status: "Open",
    requester: "Asha Mehta",
    items: [{ name: "Annual AMC", qty: 1, uom: "lot" }],
  },
];

const quotations = [
  {
    id: "QTN-1041",
    rfqId: "RFQ-2026-104",
    vendorId: vendors[0].id,
    vendorName: vendors[0].name,
    amount: 45200,
    deliveryDays: 7,
    notes: "Includes installation and 1-year support.",
    rating: 4.8,
    editable: true,
    submittedAt: "2026-06-06T09:00:00Z",
  },
  {
    id: "QTN-1042",
    rfqId: "RFQ-2026-104",
    vendorId: vendors[2].id,
    vendorName: vendors[2].name,
    amount: 43800,
    deliveryDays: 10,
    notes: "Bulk rate with staggered delivery.",
    rating: 4.7,
    editable: true,
    submittedAt: "2026-06-06T10:30:00Z",
  },
  {
    id: "QTN-1181",
    rfqId: "RFQ-2026-118",
    vendorId: vendors[1].id,
    vendorName: vendors[1].name,
    amount: 18950,
    deliveryDays: 5,
    notes: "Eco-friendly packaging and same-day dispatch.",
    rating: 4.5,
    editable: false,
    submittedAt: "2026-06-05T11:15:00Z",
  },
];

const approvals = [
  {
    id: "APR-001",
    requestId: "PR-2026-009",
    rfqId: "RFQ-2026-104",
    quotationId: "QTN-1042",
    title: "Server rack procurement",
    requester: "Asha Mehta",
    amount: 43800,
    state: "Pending",
    level: "Manager",
    remarks: "Awaiting commercial sign-off.",
    timeline: [
      { label: "Created", at: "2026-06-05 08:30" },
      { label: "Quote comparison ready", at: "2026-06-06 11:45" },
    ],
  },
  {
    id: "APR-002",
    requestId: "PR-2026-012",
    rfqId: "RFQ-2026-118",
    quotationId: "QTN-1181",
    title: "Office consumables quarterly order",
    requester: "Ravi Sharma",
    amount: 18950,
    state: "Pending",
    level: "Manager",
    remarks: "Approved budget already reserved.",
    timeline: [
      { label: "Created", at: "2026-06-04 14:10" },
      { label: "Vendor quotation received", at: "2026-06-05 10:05" },
    ],
  },
];

const purchaseOrders = [
  {
    id: "PO-2026-894",
    rfqId: "RFQ-2026-104",
    quotationId: "QTN-1042",
    vendorName: vendors[2].name,
    amount: 43800,
    taxPercent: 18,
    status: "Issued",
    issuedAt: "2026-06-06",
    contactEmail: "ops@nimbuslogistics.com",
  },
  {
    id: "PO-2026-901",
    rfqId: "RFQ-2026-118",
    quotationId: "QTN-1181",
    vendorName: vendors[1].name,
    amount: 18950,
    taxPercent: 18,
    status: "Approved",
    issuedAt: "2026-06-05",
    contactEmail: "sales@metrooffice.in",
  },
];

const invoices = [
  {
    id: "INV-2026-311",
    poId: "PO-2026-894",
    vendorName: vendors[2].name,
    subtotal: 43800,
    taxPercent: 18,
    total: 51684,
    status: "Ready",
    recipient: "billing@nimbuslogistics.com",
    emailed: false,
  },
  {
    id: "INV-2026-312",
    poId: "PO-2026-901",
    vendorName: vendors[1].name,
    subtotal: 18950,
    taxPercent: 18,
    total: 22351,
    status: "Emailed",
    recipient: "sales@metrooffice.in",
    emailed: true,
  },
];

const activities = [
  { id: createId("ACT"), time: "09:00", title: "RFQ-2026-104 published", detail: "Invitations sent to 3 vendors.", tone: "info" },
  { id: createId("ACT"), time: "10:30", title: "Quotation received", detail: "Nimbus Logistics submitted commercial proposal.", tone: "success" },
  { id: createId("ACT"), time: "11:15", title: "Approval queued", detail: "RFQ-2026-104 moved to manager approval.", tone: "warning" },
  { id: createId("ACT"), time: "11:45", title: "Invoice ready", detail: "INV-2026-312 prepared for email dispatch.", tone: "primary" },
];

const monthlyTrend = [
  { month: "Jan", spend: 28000 },
  { month: "Feb", spend: 31000 },
  { month: "Mar", spend: 39000 },
  { month: "Apr", spend: 47000 },
  { month: "May", spend: 52000 },
  { month: "Jun", spend: 61800 },
];

export const createPortalSeed = () => ({
  users,
  vendors,
  rfqs,
  quotations,
  approvals,
  purchaseOrders,
  invoices,
  activities,
  monthlyTrend,
});
