/**
 * Responsive HTML email templates for VendorBridge ERP.
 * Designed with a modern, professional palette, clean typography, and robust formatting.
 */

const baseLayout = (content, previewText) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>VendorBridge ERP</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: #334155;
      -webkit-font-smoothing: antialiased;
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
      width: 100%;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8fafc;
      padding-top: 40px;
      padding-bottom: 40px;
    }
    .main-table {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #0f172a;
      padding: 32px 40px;
      text-align: center;
    }
    .header-title {
      color: #ffffff !important;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .header-subtitle {
      color: #94a3b8;
      font-size: 13px;
      margin: 6px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .content-container {
      padding: 40px;
    }
    .btn {
      display: inline-block;
      padding: 12px 28px;
      font-size: 15px;
      font-weight: 600;
      text-align: center;
      text-decoration: none;
      border-radius: 6px;
      margin: 24px 0;
    }
    .btn-primary {
      background-color: #3b82f6;
      color: #ffffff !important;
    }
    .btn-success {
      background-color: #10b981;
      color: #ffffff !important;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #64748b;
      margin: 0 0 8px 0;
    }
    .footer-text a {
      color: #3b82f6;
      text-decoration: none;
    }
    .divider {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 24px 0;
    }
    h2 {
      color: #1e293b;
      font-size: 20px;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 16px;
    }
    p {
      margin-top: 0;
      margin-bottom: 16px;
      color: #475569;
    }
    ul {
      margin: 0 0 20px 0;
      padding-left: 20px;
      color: #475569;
    }
    li {
      margin-bottom: 8px;
    }
    .preview-text {
      display: none;
      max-height: 0px;
      overflow: hidden;
      mso-hide: all;
    }
  </style>
</head>
<body>
  <!-- Preheader preview text -->
  <div class="preview-text">${previewText}</div>
  <center class="wrapper">
    <table class="main-table">
      <!-- Header -->
      <tr>
        <td class="header">
          <h1 class="header-title">VendorBridge ERP</h1>
          <p class="header-subtitle">Enterprise Collaboration & Procurement</p>
        </td>
      </tr>
      <!-- Body Content -->
      <tr>
        <td class="content-container">
          ${content}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td class="footer">
          <p class="footer-text">This is an automated system email from VendorBridge ERP.</p>
          <p class="footer-text">&copy; ${new Date().getFullYear()} VendorBridge Inc. All rights reserved.</p>
          <p class="footer-text"><a href="#">Support Center</a> &bull; <a href="#">Privacy Policy</a></p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
`;

/**
 * Generates the User Registration Welcome Email
 */
const getWelcomeEmail = (userName, loginLink) => {
  const content = `
    <h2>Welcome to the Platform, ${userName}!</h2>
    <p>We are delighted to welcome you to <strong>VendorBridge ERP</strong>, the modern bridge connecting enterprise buyers and business vendors.</p>
    <p>Your account has been successfully registered. You can now access your customized dashboard to begin managing your procurement workflows and bids.</p>
    
    <div style="text-align: center;">
      <a href="${loginLink}" class="btn btn-primary">Log In to Your Account</a>
    </div>

    <p>To get started, follow these simple steps:</p>
    <ul>
      <li>Complete your profile details.</li>
      <li>Review open Request for Quotations (RFQs) if you are a Vendor.</li>
      <li>Verify your contact information to receive direct purchase order dispatches.</li>
    </ul>

    <hr class="divider" />
    <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this URL into your browser:<br>
    <a href="${loginLink}" style="color: #3b82f6; word-break: break-all;">${loginLink}</a></p>
  `;
  return baseLayout(content, "Welcome to VendorBridge ERP! Let's get your account set up.");
};

/**
 * Generates the Password Reset Email
 */
const getPasswordResetEmail = (userName, resetLink, expiryInfo = "1 hour") => {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello ${userName},</p>
    <p>We received a request to reset your password for your VendorBridge ERP account. Click the button below to specify a new password:</p>
    
    <div style="text-align: center;">
      <a href="${resetLink}" class="btn btn-primary" style="background-color: #4f46e5;">Reset Password</a>
    </div>

    <p>This password reset link is valid for <strong>${expiryInfo}</strong>. If you did not request a password change, you can safely ignore this email; your password will remain secure and unchanged.</p>

    <hr class="divider" />
    <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this URL into your browser:<br>
    <a href="${resetLink}" style="color: #3b82f6; word-break: break-all;">${resetLink}</a></p>
  `;
  return baseLayout(content, "Reset your VendorBridge ERP password. Link valid for " + expiryInfo + ".");
};

/**
 * Generates the Vendor Account Approval Email
 */
const getVendorApprovalEmail = (userName, dashboardLink) => {
  const content = `
    <h2>Vendor Account Approved!</h2>
    <p>Hello ${userName},</p>
    <p>Great news! Your application to become a verified vendor on <strong>VendorBridge ERP</strong> has been reviewed and <strong>approved</strong> by our procurement panel.</p>
    <p>Your account status has been updated to active, and you can now log in to review all open procurement requisitions, publish quotations, and communicate with purchase managers.</p>
    
    <div style="text-align: center;">
      <a href="${dashboardLink}" class="btn btn-success">Access Vendor Portal</a>
    </div>

    <p>Next steps to maximize your presence:</p>
    <ul>
      <li>Set up your company profile page (upload logos and catalogs).</li>
      <li>Add tax and banking details to accelerate purchase order processing.</li>
      <li>Browse and reply to open RFQs matching your industrial domains.</li>
    </ul>

    <hr class="divider" />
    <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this URL into your browser:<br>
    <a href="${dashboardLink}" style="color: #10b981; word-break: break-all;">${dashboardLink}</a></p>
  `;
  return baseLayout(content, "Congratulations! Your VendorBridge ERP account has been approved.");
};

module.exports = {
  getWelcomeEmail,
  getPasswordResetEmail,
  getVendorApprovalEmail,
};
