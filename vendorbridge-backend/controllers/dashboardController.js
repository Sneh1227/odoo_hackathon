const dashboardService = require("../services/dashboardService");
const db = require("../db");

/**
 * Controller to handle VendorBridge dashboard requests.
 */
const dashboardController = {
  getAdminDashboard: async (req, res) => {
    try {
      const summary = await dashboardService.getAdminSummary();
      const charts = await dashboardService.getAdminCharts();
      const tables = await dashboardService.getAdminTables();
      const logs = await dashboardService.getActivityLogs();
      const users = await dashboardService.getAdminUsers();

      return res.json({
        success: true,
        summary,
        charts,
        tables,
        logs,
        users
      });
    } catch (error) {
      console.error("[Admin Dashboard API Error]:", error);
      return res.status(500).json({ success: false, message: "Internal server error fetching admin dashboard data." });
    }
  },

  getVendorDashboard: async (req, res) => {
    try {
      const email = req.user.email;
      const summary = await dashboardService.getVendorSummary(email);
      
      if (!summary) {
        return res.status(404).json({ success: false, message: "Vendor profile not found for the authenticated user." });
      }

      const tables = await dashboardService.getVendorTables(summary.vendorId);

      return res.json({
        success: true,
        summary,
        tables
      });
    } catch (error) {
      console.error("[Vendor Dashboard API Error]:", error);
      return res.status(500).json({ success: false, message: "Internal server error fetching vendor dashboard data." });
    }
  },

  getProcurementDashboard: async (req, res) => {
    try {
      const summary = await dashboardService.getProcurementSummary();
      const analytics = await dashboardService.getProcurementAnalytics();

      return res.json({
        success: true,
        summary,
        analytics
      });
    } catch (error) {
      console.error("[Procurement Dashboard API Error]:", error);
      return res.status(500).json({ success: false, message: "Internal server error fetching procurement dashboard data." });
    }
  },

  getManagerDashboard: async (req, res) => {
    try {
      const userId = req.user.id;
      const summary = await dashboardService.getManagerSummary(userId);
      const pendingApprovals = await dashboardService.getManagerPendingApprovals();

      return res.json({
        success: true,
        summary,
        pendingApprovals
      });
    } catch (error) {
      console.error("[Manager Dashboard API Error]:", error);
      return res.status(500).json({ success: false, message: "Internal server error fetching manager dashboard data." });
    }
  },

  getActivityLogs: async (req, res) => {
    try {
      const logs = await dashboardService.getActivityLogs();
      return res.json({ success: true, logs });
    } catch (error) {
      console.error("[Activity Logs API Error]:", error);
      return res.status(500).json({ success: false, message: "Internal server error fetching activity logs." });
    }
  },

  handleApprovalAction: async (req, res) => {
    const { id } = req.params; // approval_id
    const { action, remarks } = req.body; // 'Approved' or 'Rejected'
    const userId = req.user.id; // Manager user_id

    if (!id || !action || !["Approved", "Rejected"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid approval parameters." });
    }

    try {
      // 1. Get approval and quotation details
      const approvalRes = await db.query(
        "SELECT a.*, q.quotation_no, q.total_amount, q.rfq_id FROM tbl_approvals a JOIN tbl_quotations q ON a.quotation_id = q.quotation_id WHERE a.approval_id = $1",
        [id]
      );
      if (approvalRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Approval request record not found." });
      }
      
      const approval = approvalRes.rows[0];

      if (approval.status !== "Pending") {
        return res.status(400).json({ success: false, message: "This quotation has already been actioned." });
      }

      // 2. Update approval status
      await db.query(
        "UPDATE tbl_approvals SET status = $1, remarks = $2, approval_date = NOW(), approved_by = $3 WHERE approval_id = $4",
        [action, remarks || "", userId, id]
      );

      // 3. Update quotation status
      await db.query(
        "UPDATE tbl_quotations SET status = $1 WHERE quotation_id = $2",
        [action, approval.quotation_id]
      );

      // 4. Log the action
      await db.query(
        "INSERT INTO tbl_activity_logs (user_id, action, reference_type, reference_id, description) VALUES ($1, $2, 'tbl_approvals', $3, $4)",
        [
          userId, 
          action === "Approved" ? "Approve" : "Reject", 
          id, 
          `${action === "Approved" ? "Approved" : "Rejected"} quotation ${approval.quotation_no} (Value: $${approval.total_amount})`
        ]
      );

      // 5. If approved, generate PO and PO items
      if (action === "Approved") {
        const poNo = `PO-${Date.now().toString().slice(-6)}`;
        
        // Insert PO
        const poRes = await db.query(
          "INSERT INTO tbl_purchase_orders (po_no, quotation_id, po_date, total_amount, status) VALUES ($1, $2, NOW(), $3, 'Approved') RETURNING po_id",
          [poNo, approval.quotation_id, approval.total_amount]
        );
        const poId = poRes.rows[0].po_id;

        // Copy quote items to PO items
        const quoteItems = await db.query(
          "SELECT rfq_item_id, quantity, unit_price, amount FROM tbl_quotation_items WHERE quotation_id = $1",
          [approval.quotation_id]
        );

        for (const item of quoteItems.rows) {
          await db.query(
            "INSERT INTO tbl_po_items (po_id, rfq_item_id, quantity, unit_price, amount) VALUES ($1, $2, $3, $4, $5)",
            [poId, item.rfq_item_id, item.quantity, item.unit_price, item.amount]
          );
        }

        // Close corresponding RFQ
        await db.query(
          "UPDATE tbl_rfq SET status = 'Closed' WHERE rfq_id = $1",
          [approval.rfq_id]
        );

        console.log(`[Dashboard Controller] Generated PO ${poNo} successfully.`);
      }

      return res.json({
        success: true,
        message: `Quotation has been successfully ${action.toLowerCase()}.`
      });
    } catch (error) {
      console.error("[Approval Action Error]:", error);
      return res.status(500).json({ success: false, message: "Internal server error processing approval decision." });
    }
  }
};

module.exports = dashboardController;
