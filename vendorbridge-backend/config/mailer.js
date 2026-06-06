const nodemailer = require("nodemailer");
require("dotenv").config();

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.mailtrap.io",
  port: parseInt(process.env.EMAIL_PORT || "2525"),
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.warn("Nodemailer SMTP configuration warning/error:", error.message);
  } else {
    console.log("Nodemailer SMTP server is ready to send messages.");
  }
});

/**
 * Sends a password reset email to a user.
 * @param {string} toEmail - Recipient email
 * @param {string} userName - Recipient full name
 * @param {string} resetLink - Absolute URL to the reset password page
 * @param {string} expiryInfo - Expiry duration string (e.g. '1 hour')
 */
const sendResetEmail = async (toEmail, userName, resetLink, expiryInfo = "1 hour") => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "VendorBridge ERP"}" <${process.env.EMAIL_FROM || "no-reply@vendorbridge.com"}>`,
    to: toEmail,
    subject: "Reset Your Password - VendorBridge ERP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9ecef; border-radius: 5px;">
        <h2 style="color: #0d6efd;">VendorBridge ERP</h2>
        <p>Hello ${userName},</p>
        <p>We received a request to reset your password for your VendorBridge account.</p>
        <p>Please click the button below to set a new password. This link is valid for <strong>${expiryInfo}</strong>.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetLink}" style="background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #6c757d; font-size: 0.9em;">If you did not request a password reset, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e9ecef; margin: 20px 0;" />
        <p style="color: #6c757d; font-size: 0.8em; text-align: center;">
          VendorBridge ERP &copy; ${new Date().getFullYear()}
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  transporter,
  sendResetEmail,
};
