const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const authenticateToken = require("../authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// 1. Admin Dashboard Route
router.get(
  "/admin",
  authenticateToken,
  authorizeRoles("Admin"),
  dashboardController.getAdminDashboard
);

// 2. Vendor Dashboard Route
router.get(
  "/vendor",
  authenticateToken,
  authorizeRoles("Vendor"),
  dashboardController.getVendorDashboard
);

// 3. Procurement Dashboard Route
router.get(
  "/procurement",
  authenticateToken,
  authorizeRoles("Procurement Officer"),
  dashboardController.getProcurementDashboard
);

// 4. Manager (Approver) Dashboard Route
router.get(
  "/manager",
  authenticateToken,
  authorizeRoles("Manager"),
  dashboardController.getManagerDashboard
);

// 5. Activity Logs Route (Accessible by Admin and Procurement)
router.get(
  "/logs",
  authenticateToken,
  authorizeRoles("Admin", "Procurement Officer"),
  dashboardController.getActivityLogs
);

// 6. Action Approval (Restricted to Manager)
router.put(
  "/approval/:id",
  authenticateToken,
  authorizeRoles("Manager"),
  dashboardController.handleApprovalAction
);

module.exports = router;
