import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createPortalSeed } from "../data/portalSeed";

const STORAGE_KEY = "vendorbridge.procurement.state.v1";

const loadState = () => {
  if (typeof window === "undefined") {
    return createPortalSeed();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...createPortalSeed(),
        ...parsed,
      };
    }
  } catch (error) {
    console.warn("Failed to load portal state", error);
  }

  return createPortalSeed();
};

const formatDateTime = (value = new Date()) => new Date(value).toLocaleString([], {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatDate = (value = new Date()) => new Date(value).toLocaleDateString([], {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const addActivity = (activities, title, detail, tone = "info") => [
  {
    id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: formatDateTime(),
    title,
    detail,
    tone,
  },
  ...activities,
].slice(0, 40);

const buildInvoice = (po, existingCount) => ({
  id: `INV-${new Date().getFullYear()}-${String(existingCount + 313).padStart(3, "0")}`,
  poId: po.id,
  vendorName: po.vendorName,
  subtotal: po.amount,
  taxPercent: po.taxPercent,
  total: Math.round(po.amount * (1 + po.taxPercent / 100)),
  status: "Ready",
  recipient: po.contactEmail,
  emailed: false,
});

const buildPurchaseOrder = (quotation, existingCount) => ({
  id: `PO-${new Date().getFullYear()}-${String(existingCount + 902).padStart(3, "0")}`,
  rfqId: quotation.rfqId,
  quotationId: quotation.id,
  vendorName: quotation.vendorName,
  amount: quotation.amount,
  taxPercent: 18,
  status: "Issued",
  issuedAt: formatDate(),
  contactEmail: quotation.vendorName.includes("Acme") ? "billing@acme.com" : "billing@vendor.com",
});

const ProcurementContext = createContext(null);

export const ProcurementProvider = ({ children }) => {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const summary = useMemo(() => {
    const pendingApprovals = state.approvals.filter((item) => item.state === "Pending").length;
    const activeRfqs = state.rfqs.filter((item) => item.status !== "Closed").length;
    const openInvoices = state.invoices.filter((item) => item.status !== "Emailed").length;
    const monthlySpend = state.purchaseOrders.reduce((total, item) => total + item.amount, 0);

    return {
      activeUsers: state.users.length,
      verifiedVendors: state.vendors.filter((item) => item.verified).length,
      pendingApprovals,
      activeRfqs,
      recentPurchaseOrders: state.purchaseOrders.slice(0, 3),
      recentInvoices: state.invoices.slice(0, 3),
      openInvoices,
      monthlySpend,
      latestActivities: state.activities.slice(0, 6),
    };
  }, [state]);

  const upsertVendor = (vendor) => {
    setState((prev) => {
      const nextVendor = {
        id: vendor.id || `VND-${Date.now()}`,
        name: vendor.name,
        category: vendor.category,
        gst: vendor.gst,
        contact: vendor.contact,
        status: vendor.status || "Pending Review",
        rating: Number(vendor.rating || 4.2),
        verified: Boolean(vendor.verified),
        spend: Number(vendor.spend || 0),
      };

      const vendors = vendor.id
        ? prev.vendors.map((item) => (item.id === vendor.id ? nextVendor : item))
        : [nextVendor, ...prev.vendors];

      return {
        ...prev,
        vendors,
        activities: addActivity(prev.activities, "Vendor saved", `${nextVendor.name} was updated in the master list.`, "success"),
      };
    });
  };

  const toggleVendorStatus = (vendorId) => {
    setState((prev) => {
      const vendors = prev.vendors.map((item) =>
        item.id === vendorId
          ? { ...item, verified: !item.verified, status: item.verified ? "Pending Review" : "Verified" }
          : item
      );
      const vendor = vendors.find((item) => item.id === vendorId);
      return {
        ...prev,
        vendors,
        activities: addActivity(prev.activities, "Vendor status updated", `${vendor?.name || vendorId} is now ${vendor?.status || "updated"}.`, "warning"),
      };
    });
  };

  const toggleUserStatus = (userId) => {
    setState((prev) => {
      const users = prev.users.map((item) =>
        item.id === userId
          ? { ...item, status: item.status === "Active" ? "Suspended" : "Active" }
          : item
      );
      const user = users.find((item) => item.id === userId);

      return {
        ...prev,
        users,
        activities: addActivity(prev.activities, "User access updated", `${user?.name || userId} is now ${user?.status || "updated"}.`, "warning"),
      };
    });
  };

  const createRfq = (rfq) => {
    setState((prev) => {
      const newRfq = {
        id: `RFQ-${new Date().getFullYear()}-${String(prev.rfqs.length + 200).padStart(3, "0")}`,
        title: rfq.title,
        description: rfq.description,
        deadline: rfq.deadline,
        vendorIds: rfq.vendorIds,
        status: "Open",
        requester: rfq.requester,
        items: rfq.items,
      };

      return {
        ...prev,
        rfqs: [newRfq, ...prev.rfqs],
        activities: addActivity(prev.activities, "RFQ created", `${newRfq.id} is now open for vendor bids.`, "info"),
      };
    });
  };

  const submitQuotation = (quotation) => {
    setState((prev) => {
      const quote = {
        id: `QTN-${Date.now().toString().slice(-4)}`,
        rfqId: quotation.rfqId,
        vendorId: quotation.vendorId,
        vendorName: quotation.vendorName,
        amount: Number(quotation.amount),
        deliveryDays: Number(quotation.deliveryDays),
        notes: quotation.notes,
        rating: Number(quotation.rating || 4.5),
        editable: true,
        submittedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        quotations: [quote, ...prev.quotations],
        activities: addActivity(prev.activities, "Quotation submitted", `${quote.vendorName} responded to ${quote.rfqId}.`, "success"),
      };
    });
  };

  const decideApproval = (approvalId, decision, remarks) => {
    setState((prev) => {
      const approvals = prev.approvals.map((item) =>
        item.id === approvalId
          ? {
              ...item,
              state: decision === "approved" ? "Approved" : "Rejected",
              remarks: remarks || item.remarks,
            }
          : item
      );

      const approval = prev.approvals.find((item) => item.id === approvalId);
      const quotation = prev.quotations.find((item) => item.id === approval?.quotationId);
      const existingPo = prev.purchaseOrders.find((item) => item.quotationId === quotation?.id);
      let purchaseOrders = prev.purchaseOrders;
      let invoices = prev.invoices;

      if (decision === "approved" && quotation && !existingPo) {
        const po = buildPurchaseOrder(quotation, prev.purchaseOrders.length);
        const invoice = buildInvoice(po, prev.invoices.length);
        purchaseOrders = [po, ...prev.purchaseOrders];
        invoices = [invoice, ...prev.invoices];
      }

      return {
        ...prev,
        approvals,
        purchaseOrders,
        invoices,
        activities: addActivity(
          prev.activities,
          `Approval ${decision}`,
          `${approval?.requestId || approvalId} was ${decision}.`,
          decision === "approved" ? "success" : "danger"
        ),
      };
    });
  };

  const generatePurchaseOrderFromQuotation = (quotationId) => {
    setState((prev) => {
      const quotation = prev.quotations.find((item) => item.id === quotationId);
      if (!quotation) {
        return prev;
      }

      if (prev.purchaseOrders.some((item) => item.quotationId === quotationId)) {
        return {
          ...prev,
          activities: addActivity(prev.activities, "PO already exists", `${quotationId} already has a purchase order.`, "warning"),
        };
      }

      const po = buildPurchaseOrder(quotation, prev.purchaseOrders.length);
      return {
        ...prev,
        purchaseOrders: [po, ...prev.purchaseOrders],
        activities: addActivity(prev.activities, "Purchase order generated", `${po.id} was created from ${quotationId}.`, "success"),
      };
    });
  };

  const generateInvoiceFromPo = (poId) => {
    setState((prev) => {
      const po = prev.purchaseOrders.find((item) => item.id === poId);
      if (!po) {
        return prev;
      }

      if (prev.invoices.some((item) => item.poId === poId)) {
        return {
          ...prev,
          activities: addActivity(prev.activities, "Invoice already exists", `${poId} already has an invoice.`, "warning"),
        };
      }

      const invoice = buildInvoice(po, prev.invoices.length);
      return {
        ...prev,
        invoices: [invoice, ...prev.invoices],
        activities: addActivity(prev.activities, "Invoice generated", `${invoice.id} was created for ${poId}.`, "success"),
      };
    });
  };

  const markInvoiceEmailed = (invoiceId) => {
    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.map((item) =>
        item.id === invoiceId ? { ...item, status: "Emailed", emailed: true } : item
      ),
      activities: addActivity(prev.activities, "Invoice emailed", `${invoiceId} was marked as emailed.`, "primary"),
    }));
  };

  const value = {
    state,
    summary,
    toggleUserStatus,
    upsertVendor,
    toggleVendorStatus,
    createRfq,
    submitQuotation,
    decideApproval,
    generatePurchaseOrderFromQuotation,
    generateInvoiceFromPo,
    markInvoiceEmailed,
  };

  return <ProcurementContext.Provider value={value}>{children}</ProcurementContext.Provider>;
};

export const useProcurementPortal = () => {
  const context = useContext(ProcurementContext);
  if (!context) {
    throw new Error("useProcurementPortal must be used inside ProcurementProvider");
  }
  return context;
};
