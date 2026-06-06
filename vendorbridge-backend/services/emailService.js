const nodemailer = require("nodemailer");
const { getWelcomeEmail, getPasswordResetEmail, getVendorApprovalEmail, getVendorDeclineEmail, getAdminNewVendorNotificationEmail } = require("./emailTemplates");
require("dotenv").config();

// Default values point to Gmail SMTP
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || "587");
const EMAIL_SECURE = process.env.EMAIL_SECURE === "true"; // Defaults to false for port 587 (STARTTLS)
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@vendorbridge.com";
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "VendorBridge ERP";

// Validate configurations
if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn(
    "[Email Service] WARNING: EMAIL_USER or EMAIL_PASS environment variables are not set. " +
    "SMTP transmission may fail or require authentication details."
  );
}

// 1. Initialize SMTP transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_SECURE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  // We use tls options for standard STARTTLS fallback / certificate rejection protection
  tls: {
    rejectUnauthorized: false,
  },
});

// 2. Verify connection on startup
transporter.verify((error, success) => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[${timestamp}] [Email Service] Connection verification failed:`, error.message);
  } else {
    console.log(`[${timestamp}] [Email Service] SMTP transporter verified and ready to send emails via ${EMAIL_HOST}:${EMAIL_PORT}`);
  }
});

/**
 * Generic function to send email.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plain text content fallback
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const timestamp = new Date().toISOString();
  const mailOptions = {
    from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
    to,
    subject,
    html,
    text: text || "This email requires an HTML compatible email viewer.",
  };

  try {
    console.log(`[${timestamp}] [Email Service] Attempting to send email to ${to} (Subject: "${subject}")`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[${timestamp}] [Email Service] Email sent successfully. MessageID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[${timestamp}] [Email Service] Error sending email to ${to}:`, error);
    throw error;
  }
};

/**
 * Sends a welcome email to a newly registered user.
 */
const sendWelcomeEmail = async (toEmail, userName) => {
  const loginLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
  const html = getWelcomeEmail(userName, loginLink);
  
  return sendEmail({
    to: toEmail,
    subject: "Welcome to VendorBridge ERP!",
    html,
    text: `Hello ${userName}, welcome to VendorBridge ERP! Please log in to your account at ${loginLink} to get started.`,
  });
};

/**
 * Sends a password reset email.
 */
const sendPasswordResetEmail = async (toEmail, userName, resetLink, expiryInfo = "1 hour") => {
  const html = getPasswordResetEmail(userName, resetLink, expiryInfo);
  
  return sendEmail({
    to: toEmail,
    subject: "Reset Your Password - VendorBridge ERP",
    html,
    text: `Hello ${userName}, we received a request to reset your password. Please visit this link to set a new password: ${resetLink}. This link will expire in ${expiryInfo}.`,
  });
};

/**
 * Sends a vendor approval success email.
 */
const sendVendorApprovalEmail = async (toEmail, userName, remarks) => {
  const portalLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
  const html = getVendorApprovalEmail(userName, portalLink, remarks);
  
  return sendEmail({
    to: toEmail,
    subject: "Your Vendor Account Has Been Approved! - VendorBridge ERP",
    html,
    text: `Hello ${userName}, congratulations! Your VendorBridge ERP account has been approved by our procurement team. Remarks: ${remarks || "Approved."} You can now log in at ${portalLink} to access your portal.`,
  });
};

/**
 * Sends a vendor decline email.
 */
const sendVendorDeclineEmail = async (toEmail, userName, remarks) => {
  const html = getVendorDeclineEmail(userName, remarks);
  
  return sendEmail({
    to: toEmail,
    subject: "Vendor Account Registration Update - VendorBridge ERP",
    html,
    text: `Hello ${userName}, we regret to inform you that your vendor account application has been declined. Remarks: ${remarks || "Declined."}`,
  });
};

/**
 * Sends a notification email to an admin when a new vendor registers.
 */
const sendAdminVendorRegistrationNotification = async (adminEmail, adminName, vendorName, vendorEmail) => {
  const portalLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
  const html = getAdminNewVendorNotificationEmail(adminName, vendorName, vendorEmail, portalLink);
  
  return sendEmail({
    to: adminEmail,
    subject: "Action Required: New Vendor Registration Awaiting Approval",
    html,
    text: `Hello ${adminName}, a new vendor (${vendorName}, email: ${vendorEmail}) has registered on VendorBridge ERP. Please review and approve/decline them at ${portalLink}`,
  });
};

module.exports = {
  transporter,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVendorApprovalEmail,
  sendVendorDeclineEmail,
  sendAdminVendorRegistrationNotification,
};
