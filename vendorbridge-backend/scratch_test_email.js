/**
 * Standalone verification script for VendorBridge email services.
 * Tests configuration, transporter verification, and templated emails.
 * 
 * Usage:
 *   node scratch_test_email.js [recipient-email-optional]
 */

const { 
  transporter, 
  sendWelcomeEmail, 
  sendPasswordResetEmail, 
  sendVendorApprovalEmail 
} = require("./services/emailService");

require("dotenv").config();

const testRecipient = process.argv[2] || process.env.EMAIL_FROM || process.env.EMAIL_USER;

async function runTest() {
  console.log("----------------------------------------------------------------");
  console.log("Starting VendorBridge SMTP Email Service Verification Test...");
  console.log(`Target Recipient: ${testRecipient}`);
  console.log(`Configured User:   ${process.env.EMAIL_USER}`);
  console.log(`Configured Host:   ${process.env.EMAIL_HOST || "smtp.gmail.com"}:${process.env.EMAIL_PORT || "587"}`);
  console.log("----------------------------------------------------------------");

  if (!testRecipient || testRecipient.includes("your-email@gmail.com") || testRecipient.includes("mock_user")) {
    console.warn(
      "WARNING: Recipient email address is either not set or has placeholder values.\n" +
      "To receive test emails, please update the .env file with valid credentials or run the script as:\n" +
      "  node scratch_test_email.js your-actual-email@example.com\n"
    );
  }

  // 1. Verify Transporter Connection
  console.log("\n[Step 1] Verifying SMTP Transporter Connection...");
  try {
    await new Promise((resolve, reject) => {
      transporter.verify((err, success) => {
        if (err) reject(err);
        else resolve(success);
      });
    });
    console.log("✅ SMTP connection verified successfully.");
  } catch (error) {
    console.error("❌ SMTP connection verification failed:", error.message);
    console.error("Details:", error);
    console.log("Skipping email transmission tests due to connection failure.");
    process.exit(1);
  }

  // 2. Send Registration Welcome Email
  console.log("\n[Step 2] Sending Welcome Email Test...");
  try {
    const info = await sendWelcomeEmail(testRecipient, "Test User");
    console.log("✅ Welcome email sent. Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Failed to send Welcome email:", error.message);
  }

  // 3. Send Password Reset Email
  console.log("\n[Step 3] Sending Password Reset Email Test...");
  try {
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=test-verification-token-123`;
    const info = await sendPasswordResetEmail(testRecipient, "Test User", resetLink, "1 hour");
    console.log("✅ Password reset email sent. Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Failed to send Password Reset email:", error.message);
  }

  // 4. Send Vendor Account Approval Email
  console.log("\n[Step 4] Sending Vendor Account Approval Email Test...");
  try {
    const info = await sendVendorApprovalEmail(testRecipient, "Acme Vendor Corporation");
    console.log("✅ Vendor approval email sent. Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Failed to send Vendor approval email:", error.message);
  }

  console.log("\n----------------------------------------------------------------");
  console.log("Verification test finished.");
  console.log("----------------------------------------------------------------");
}

runTest();
