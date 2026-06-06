const emailService = require("../services/emailService");

/**
 * Backward compatibility wrapper for config/mailer.js imports.
 * Delegates to the unified services/emailService.js module.
 */
const sendResetEmail = async (toEmail, userName, resetLink, expiryInfo = "1 hour") => {
  return emailService.sendPasswordResetEmail(toEmail, userName, resetLink, expiryInfo);
};

module.exports = {
  transporter: emailService.transporter,
  sendResetEmail,
  // Expose newer methods as well for clean future migrations
  sendWelcomeEmail: emailService.sendWelcomeEmail,
  sendVendorApprovalEmail: emailService.sendVendorApprovalEmail,
};
