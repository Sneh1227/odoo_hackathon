import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const ProcurementContext = createContext(null);

export const ProcurementProvider = ({ children }) => {
  const [state, setState] = useState({
    users: [],
    vendors: [],
    rfqs: [],
    quotations: [],
    approvals: [],
    purchaseOrders: [],
    invoices: [],
    activities: [],
    monthlyTrend: []
  });
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await api.get("/procurement/state");
      setState(res.data);
    } catch (err) {
      console.error("Failed to fetch procurement state from database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

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

  const upsertVendor = async (vendor) => {
    // Procurement Officer doesn't register vendors anymore. Just mock update for other roles.
    setState(prev => {
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
      return { ...prev, vendors };
    });
  };

  const toggleVendorStatus = async (vendorId) => {
    try {
      await api.post(`/procurement/vendor/${vendorId}/toggle`);
      await fetchState();
    } catch (err) {
      console.error("toggleVendorStatus error:", err);
      throw err;
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      await api.post(`/procurement/user/${userId}/toggle`);
      await fetchState();
    } catch (err) {
      console.error("toggleUserStatus error:", err);
      throw err;
    }
  };

  const createRfq = async (rfq) => {
    try {
      await api.post("/procurement/rfq", rfq);
      await fetchState();
    } catch (err) {
      console.error("createRfq error:", err);
      throw err;
    }
  };

  const submitQuotation = async (quotation) => {
    try {
      await api.post("/procurement/quotation", quotation);
      await fetchState();
    } catch (err) {
      console.error("submitQuotation error:", err);
      throw err;
    }
  };

  const decideApproval = async (approvalId, decision, remarks) => {
    try {
      await api.post(`/procurement/approval/${approvalId}/decide`, { decision, remarks });
      await fetchState();
    } catch (err) {
      console.error("decideApproval error:", err);
      throw err;
    }
  };

  const generatePurchaseOrderFromQuotation = async (quotationId) => {
    try {
      await api.post("/po", { quotationId });
      await fetchState();
    } catch (err) {
      console.error("generatePurchaseOrderFromQuotation error:", err);
      throw err;
    }
  };

  const generateInvoiceFromPo = async (poId) => {
    try {
      await api.post("/invoice", { poId });
      await fetchState();
    } catch (err) {
      console.error("generateInvoiceFromPo error:", err);
      throw err;
    }
  };

  const markInvoiceEmailed = async (invoiceId) => {
    try {
      await api.post(`/procurement/invoice/${invoiceId}/email`);
      await fetchState();
    } catch (err) {
      console.error("markInvoiceEmailed error:", err);
      throw err;
    }
  };

  const value = {
    state,
    summary,
    loading,
    fetchState,
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
