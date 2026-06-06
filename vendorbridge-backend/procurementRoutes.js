const express = require("express");
const router = express.Router();
const procurementController = require("./controllers/procurementController");
const authenticateToken = require("./authMiddleware");

router.get("/state", authenticateToken, procurementController.getState);
router.post("/rfq", authenticateToken, procurementController.createRfq);
router.post("/quotation", authenticateToken, procurementController.submitQuotation);
router.post("/approval/:id/decide", authenticateToken, procurementController.decideApproval);
router.post("/po", authenticateToken, procurementController.generatePO);
router.post("/invoice", authenticateToken, procurementController.generateInvoice);
router.post("/invoice/:id/email", authenticateToken, procurementController.emailInvoice);
router.post("/vendor/:id/toggle", authenticateToken, procurementController.toggleVendorStatus);
router.post("/user/:id/toggle", authenticateToken, procurementController.toggleUserStatus);

module.exports = router;
