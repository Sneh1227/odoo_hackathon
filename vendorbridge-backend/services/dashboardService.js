const db = require("../db");

/**
 * Service to execute optimized dashboard aggregate and trend queries.
 */
const dashboardService = {
  // 1. ADMIN DASHBOARD
  getAdminSummary: async () => {
    const queries = {
      totalVendors: "SELECT COUNT(*)::int AS count FROM tbl_vendors",
      activeVendors: "SELECT COUNT(*)::int AS count FROM tbl_vendors WHERE status = 'Active'",
      pendingVendors: "SELECT COUNT(*)::int AS count FROM tbl_vendors WHERE status = 'Pending'",
      totalRfqs: "SELECT COUNT(*)::int AS count FROM tbl_rfq",
      openRfqs: "SELECT COUNT(*)::int AS count FROM tbl_rfq WHERE status = 'Open'",
      totalQuotations: "SELECT COUNT(*)::int AS count FROM tbl_quotations",
      pendingApprovals: "SELECT COUNT(*)::int AS count FROM tbl_approvals WHERE status = 'Pending'",
      approvedQuotations: "SELECT COUNT(*)::int AS count FROM tbl_quotations WHERE status = 'Approved'",
      posGenerated: "SELECT COUNT(*)::int AS count FROM tbl_purchase_orders",
      totalInvoices: "SELECT COUNT(*)::int AS count FROM tbl_invoices",
      invoiceRevenue: "SELECT COALESCE(SUM(total_amount), 0)::float AS revenue FROM tbl_invoices WHERE status = 'Paid'"
    };

    const results = {};
    for (const [key, sql] of Object.entries(queries)) {
      const res = await db.query(sql);
      results[key] = res.rows[0].count !== undefined ? res.rows[0].count : res.rows[0].revenue;
    }
    return results;
  },

  getAdminCharts: async () => {
    const rfqsTrend = await db.query(
      `SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*)::int AS count 
       FROM tbl_rfq 
       GROUP BY month 
       ORDER BY month`
    );
    const quotesTrend = await db.query(
      `SELECT DATE_TRUNC('month', submission_date) AS month, COUNT(*)::int AS count 
       FROM tbl_quotations 
       GROUP BY month 
       ORDER BY month`
    );
    const posTrend = await db.query(
      `SELECT DATE_TRUNC('month', po_date) AS month, COUNT(*)::int AS count, SUM(total_amount)::float AS total_amount 
       FROM tbl_purchase_orders 
       GROUP BY month 
       ORDER BY month`
    );
    const revenueTrend = await db.query(
      `SELECT DATE_TRUNC('month', invoice_date) AS month, SUM(total_amount)::float AS revenue 
       FROM tbl_invoices 
       WHERE status = 'Paid'
       GROUP BY month 
       ORDER BY month`
    );
    const vendorTrend = await db.query(
      `SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*)::int AS count 
       FROM tbl_vendors 
       GROUP BY month 
       ORDER BY month`
    );
    const approvalStatusDist = await db.query(
      `SELECT status, COUNT(*)::int AS count 
       FROM tbl_approvals 
       GROUP BY status`
    );

    return {
      rfqsTrend: rfqsTrend.rows,
      quotesTrend: quotesTrend.rows,
      posTrend: posTrend.rows,
      revenueTrend: revenueTrend.rows,
      vendorTrend: vendorTrend.rows,
      approvalStatusDist: approvalStatusDist.rows
    };
  },

  getAdminTables: async () => {
    const recentRfqs = await db.query(
      "SELECT rfq_id, rfq_no, title, status, deadline_date, created_at FROM tbl_rfq ORDER BY created_at DESC LIMIT 5"
    );
    const recentQuotations = await db.query(
      `SELECT q.quotation_id, q.quotation_no, q.total_amount, q.status, v.vendor_name 
       FROM tbl_quotations q 
       JOIN tbl_vendors v ON q.vendor_id = v.vendor_id 
       ORDER BY q.submission_date DESC LIMIT 5`
    );
    const recentPurchaseOrders = await db.query(
      `SELECT po.po_id, po.po_no, po.total_amount, po.status, po.po_date, v.vendor_name 
       FROM tbl_purchase_orders po 
       JOIN tbl_quotations q ON po.quotation_id = q.quotation_id 
       JOIN tbl_vendors v ON q.vendor_id = v.vendor_id 
       ORDER BY po.po_date DESC LIMIT 5`
    );
    const recentInvoices = await db.query(
      `SELECT inv.invoice_id, inv.invoice_no, inv.total_amount, inv.status, inv.invoice_date, v.vendor_name 
       FROM tbl_invoices inv 
       JOIN tbl_purchase_orders po ON inv.po_id = po.po_id 
       JOIN tbl_quotations q ON po.quotation_id = q.quotation_id 
       JOIN tbl_vendors v ON q.vendor_id = v.vendor_id 
       ORDER BY inv.invoice_date DESC LIMIT 5`
    );
    const pendingApprovals = await db.query(
      `SELECT a.approval_id, q.quotation_no, q.total_amount, v.vendor_name, a.status 
       FROM tbl_approvals a 
       JOIN tbl_quotations q ON a.quotation_id = q.quotation_id 
       JOIN tbl_vendors v ON q.vendor_id = v.vendor_id 
       WHERE a.status = 'Pending' 
       ORDER BY q.submission_date DESC LIMIT 5`
    );

    return {
      recentRfqs: recentRfqs.rows,
      recentQuotations: recentQuotations.rows,
      recentPurchaseOrders: recentPurchaseOrders.rows,
      recentInvoices: recentInvoices.rows,
      pendingApprovals: pendingApprovals.rows
    };
  },

  // 2. VENDOR DASHBOARD
  getVendorSummary: async (email) => {
    let vendorRes = await db.query("SELECT vendor_id, vendor_name FROM tbl_vendors WHERE email = $1", [email]);
    if (vendorRes.rows.length === 0) {
      // Check if user is registered in tbl_users with Vendor role (role_id = 6)
      const userRes = await db.query("SELECT full_name FROM tbl_users WHERE email = $1 AND role_id = 6", [email]);
      if (userRes.rows.length > 0) {
        const fullName = userRes.rows[0].full_name;
        vendorRes = await db.query(
          "INSERT INTO tbl_vendors (vendor_name, contact_person, email, status, rating) VALUES ($1, $2, $3, 'Pending', 5.0) RETURNING vendor_id, vendor_name",
          [fullName, fullName, email]
        );
      } else {
        return null;
      }
    }
    const vendorId = vendorRes.rows[0].vendor_id;
    const vendorName = vendorRes.rows[0].vendor_name;

    const rfqsAvailable = await db.query("SELECT COUNT(*)::int AS count FROM tbl_rfq WHERE status = 'Open'");
    const quotesSubmitted = await db.query("SELECT COUNT(*)::int AS count FROM tbl_quotations WHERE vendor_id = $1", [vendorId]);
    const approvedQuotes = await db.query("SELECT COUNT(*)::int AS count FROM tbl_quotations WHERE vendor_id = $1 AND status = 'Approved'", [vendorId]);
    const posReceived = await db.query(
      `SELECT COUNT(*)::int AS count 
       FROM tbl_purchase_orders po 
       JOIN tbl_quotations q ON po.quotation_id = q.quotation_id 
       WHERE q.vendor_id = $1`, 
      [vendorId]
    );
    const invoicesSubmitted = await db.query(
      `SELECT COUNT(*)::int AS count 
       FROM tbl_invoices inv 
       JOIN tbl_purchase_orders po ON inv.po_id = po.po_id 
       JOIN tbl_quotations q ON po.quotation_id = q.quotation_id 
       WHERE q.vendor_id = $1`, 
      [vendorId]
    );

    // Fetch live user verification status
    const userRes = await db.query("SELECT is_verified, status FROM tbl_users WHERE email = $1", [email]);
    const isVerified = userRes.rows.length > 0 ? userRes.rows[0].is_verified : false;
    const userStatus = userRes.rows.length > 0 ? userRes.rows[0].status : "Pending";

    return {
      vendorId,
      vendorName,
      isVerified,
      userStatus,
      rfqsAvailable: rfqsAvailable.rows[0].count,
      quotesSubmitted: quotesSubmitted.rows[0].count,
      approvedQuotes: approvedQuotes.rows[0].count,
      posReceived: posReceived.rows[0].count,
      invoicesSubmitted: invoicesSubmitted.rows[0].count
    };
  },

  getVendorTables: async (vendorId) => {
    const latestRfqs = await db.query(
      "SELECT rfq_id, rfq_no, title, status, deadline_date, created_at FROM tbl_rfq WHERE status = 'Open' ORDER BY created_at DESC LIMIT 5"
    );
    const quotesTracking = await db.query(
      "SELECT quotation_id, quotation_no, total_amount, status, submission_date FROM tbl_quotations WHERE vendor_id = $1 ORDER BY submission_date DESC LIMIT 5",
      [vendorId]
    );
    const purchaseOrders = await db.query(
      `SELECT po.po_id, po.po_no, po.total_amount, po.status, po.po_date, q.quotation_no 
       FROM tbl_purchase_orders po 
       JOIN tbl_quotations q ON po.quotation_id = q.quotation_id 
       WHERE q.vendor_id = $1 
       ORDER BY po.po_date DESC LIMIT 5`,
      [vendorId]
    );
    const invoices = await db.query(
      `SELECT inv.invoice_id, inv.invoice_no, inv.total_amount, inv.status, inv.invoice_date, po.po_no 
       FROM tbl_invoices inv 
       JOIN tbl_purchase_orders po ON inv.po_id = po.po_id 
       JOIN tbl_quotations q ON po.quotation_id = q.quotation_id 
       WHERE q.vendor_id = $1 
       ORDER BY inv.invoice_date DESC LIMIT 5`,
      [vendorId]
    );

    return {
      latestRfqs: latestRfqs.rows,
      quotesTracking: quotesTracking.rows,
      purchaseOrders: purchaseOrders.rows,
      invoices: invoices.rows
    };
  },

  // 3. PROCUREMENT DASHBOARD
  getProcurementSummary: async () => {
    const totalRfqs = await db.query("SELECT COUNT(*)::int AS count FROM tbl_rfq");
    const openRfqs = await db.query("SELECT COUNT(*)::int AS count FROM tbl_rfq WHERE status = 'Open'");
    const quotesReceived = await db.query("SELECT COUNT(*)::int AS count FROM tbl_quotations");
    const pendingApprovals = await db.query("SELECT COUNT(*)::int AS count FROM tbl_approvals WHERE status = 'Pending'");
    const posGenerated = await db.query("SELECT COUNT(*)::int AS count FROM tbl_purchase_orders");

    return {
      totalRfqs: totalRfqs.rows[0].count,
      openRfqs: openRfqs.rows[0].count,
      quotesReceived: quotesReceived.rows[0].count,
      pendingApprovals: pendingApprovals.rows[0].count,
      posGenerated: posGenerated.rows[0].count
    };
  },

  getProcurementAnalytics: async () => {
    const vendorPerformance = await db.query(
      "SELECT vendor_id, vendor_name, rating, category, status FROM tbl_vendors ORDER BY rating DESC LIMIT 5"
    );
    const rfqResponseRate = await db.query(
      `SELECT r.rfq_no, r.title, COUNT(q.quotation_id)::int AS response_count 
       FROM tbl_rfq r 
       LEFT JOIN tbl_quotations q ON r.rfq_id = q.rfq_id 
       GROUP BY r.rfq_id, r.rfq_no, r.title 
       ORDER BY response_count DESC LIMIT 5`
    );
    const turnAroundTime = await db.query(
      `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (a.approval_date - q.submission_date))), 0) / 86400 AS avg_days 
       FROM tbl_approvals a 
       JOIN tbl_quotations q ON a.quotation_id = q.quotation_id 
       WHERE a.approval_date IS NOT NULL`
    );
    const topVendorsByValue = await db.query(
      `SELECT v.vendor_name, SUM(po.total_amount)::float AS total_value 
       FROM tbl_purchase_orders po 
       JOIN tbl_quotations q ON po.quotation_id = q.quotation_id 
       JOIN tbl_vendors v ON q.vendor_id = v.vendor_id 
       GROUP BY v.vendor_id, v.vendor_name 
       ORDER BY total_value DESC LIMIT 5`
    );
    const spendByCategory = await db.query(
      `SELECT v.category, SUM(po.total_amount)::float AS total_spend 
       FROM tbl_purchase_orders po 
       JOIN tbl_quotations q ON po.quotation_id = q.quotation_id 
       JOIN tbl_vendors v ON q.vendor_id = v.vendor_id 
       GROUP BY v.category 
       ORDER BY total_spend DESC`
    );

    return {
      vendorPerformance: vendorPerformance.rows,
      rfqResponseRate: rfqResponseRate.rows,
      avgTurnaroundDays: turnAroundTime.rows[0] ? parseFloat(parseFloat(turnAroundTime.rows[0].avg_days).toFixed(2)) : 0,
      topVendorsByValue: topVendorsByValue.rows,
      spendByCategory: spendByCategory.rows
    };
  },

  // 4. MANAGER (APPROVER) DASHBOARD
  getManagerSummary: async (userId) => {
    const pendingApprovals = await db.query("SELECT COUNT(*)::int AS count FROM tbl_approvals WHERE status = 'Pending'");
    const totalHandled = await db.query("SELECT COUNT(*)::int AS count FROM tbl_approvals WHERE approved_by = $1", [userId]);
    const approvedQuotes = await db.query("SELECT COUNT(*)::int AS count FROM tbl_approvals WHERE approved_by = $1 AND status = 'Approved'", [userId]);
    const rejectedQuotes = await db.query("SELECT COUNT(*)::int AS count FROM tbl_approvals WHERE approved_by = $1 AND status = 'Rejected'", [userId]);

    return {
      pendingApprovals: pendingApprovals.rows[0].count,
      totalHandled: totalHandled.rows[0].count,
      approvedQuotes: approvedQuotes.rows[0].count,
      rejectedQuotes: rejectedQuotes.rows[0].count
    };
  },

  getManagerPendingApprovals: async () => {
    const pendingList = await db.query(
      `SELECT a.approval_id, q.quotation_id, q.quotation_no, q.total_amount, q.submission_date, v.vendor_name, a.status 
       FROM tbl_approvals a 
       JOIN tbl_quotations q ON a.quotation_id = q.quotation_id 
       JOIN tbl_vendors v ON q.vendor_id = v.vendor_id 
       WHERE a.status = 'Pending' 
       ORDER BY q.submission_date DESC`
    );
    return pendingList.rows;
  },

  // 5. ACTIVITY LOGS
  getActivityLogs: async () => {
    const logs = await db.query(
      `SELECT l.log_id, l.action, l.reference_type, l.reference_id, l.description, l.created_at, u.full_name AS user_name 
       FROM tbl_activity_logs l 
       JOIN tbl_users u ON l.user_id = u.user_id 
       ORDER BY l.created_at DESC LIMIT 15`
    );
    return logs.rows;
  },

  // 6. USERS LIST
  getAdminUsers: async () => {
    const res = await db.query(
      `SELECT u.user_id, u.full_name, u.email, u.status, u.is_verified, u.created_at,
         CASE u.role_id 
           WHEN 5 THEN 'Admin'
           WHEN 6 THEN 'Vendor'
           WHEN 7 THEN 'Procurement Officer'
           WHEN 8 THEN 'Manager'
           ELSE 'Vendor'
         END AS role 
       FROM tbl_users u 
       ORDER BY u.created_at DESC`
    );
    return res.rows;
  }
};

module.exports = dashboardService;
