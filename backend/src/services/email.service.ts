import nodemailer from "nodemailer";

// -----------------------------------------------------------------------------
// Email Service — Nodemailer wrapper
// All email-sending logic goes through this service.
// -----------------------------------------------------------------------------

interface SendInvoiceEmailOptions {
  to: string;
  invoiceNumber: string;
  vendorName: string;
  grandTotal: number;
  pdfBuffer: Buffer;
}

// Create reusable transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: false, // TLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// -----------------------------------------------------------------------------
// sendInvoiceEmail
// Sends an invoice PDF as an email attachment.
// -----------------------------------------------------------------------------
export async function sendInvoiceEmail(
  options: SendInvoiceEmailOptions
): Promise<void> {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM ?? "VendorBridge <noreply@vendorbridge.com>",
    to: options.to,
    subject: `Invoice ${options.invoiceNumber} from VendorBridge`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">VendorBridge</h2>
        <p>Dear ${options.vendorName},</p>
        <p>
          Please find attached your invoice <strong>${options.invoiceNumber}</strong>
          for the amount of <strong>$${options.grandTotal.toFixed(2)}</strong>.
        </p>
        <p>Please review the attached PDF and contact us if you have any questions.</p>
        <hr style="border-color: #e5e7eb;" />
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated email from VendorBridge ERP. Please do not reply.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `${options.invoiceNumber}.pdf`,
        content: options.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

// -----------------------------------------------------------------------------
// sendOTPEmail
// Sends a 6-digit OTP verification code to the user.
// -----------------------------------------------------------------------------
export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM ?? "VendorBridge <noreply@vendorbridge.com>",
      to: email,
      subject: `${otp} is your VendorBridge Verification Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 8px;">
          <h2 style="color: #2563eb; margin-bottom: 24px;">VendorBridge Verification</h2>
          <p>Hello,</p>
          <p>Thank you for starting your vendor onboarding process. Please verify your email address by entering the following OTP verification code:</p>
          <div style="background-color: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1f2937; margin: 24px 0;">
            ${otp}
          </div>
          <p>This code is valid for <strong>10 minutes</strong>. If you did not request this code, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            This is an automated email from VendorBridge ERP. Please do not reply.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Sent OTP successfully to ${email}`);
  } catch (error: any) {
    console.log("\n------------------------------------------------");
    console.log(`[SMTP OFFLINE/DEV] Failed to send email to ${email}: ${error.message}`);
    console.log(`[DEVELOPMENT REGISTRATION OTP] OTP for ${email}: ${otp}`);
    console.log("------------------------------------------------\n");
  }
}

// -----------------------------------------------------------------------------
// sendVendorRegisteredEmail
// Notifies a vendor that their registration is successfully submitted.
// -----------------------------------------------------------------------------
export async function sendVendorRegisteredEmail(email: string, companyName: string): Promise<void> {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM ?? "VendorBridge <noreply@vendorbridge.com>",
      to: email,
      subject: "Vendor Profile Submitted - Pending Administrative Review",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 8px;">
          <h2 style="color: #059669; margin-bottom: 24px;">VendorBridge Onboarding</h2>
          <p>Dear ${companyName} Team,</p>
          <p>We have received your vendor registration details. Your profile is currently under review by our procurement administration team.</p>
          <p>You will receive an email notification as soon as your account is approved and activated.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated email from VendorBridge ERP. Please do not reply.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Sent registration confirmation to ${email}`);
  } catch (error: any) {
    console.log("\n------------------------------------------------");
    console.log(`[SMTP OFFLINE/DEV] Failed to send email to ${email}: ${error.message}`);
    console.log(`[DEVELOPMENT VENDOR REGISTERED] Vendor: ${companyName} Registered.`);
    console.log("------------------------------------------------\n");
  }
}

// -----------------------------------------------------------------------------
// sendAdminNewVendorRegisteredEmail
// Notifies an admin that a new vendor profile needs approval.
// -----------------------------------------------------------------------------
export async function sendAdminNewVendorRegisteredEmail(
  adminEmail: string,
  companyName: string,
  vendorName: string,
  vendorEmail: string
): Promise<void> {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM ?? "VendorBridge <noreply@vendorbridge.com>",
      to: adminEmail,
      subject: "Action Required: New Vendor Registration Pending Approval",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 8px;">
          <h2 style="color: #d97706; margin-bottom: 24px;">New Vendor Request</h2>
          <p>Hello Admin,</p>
          <p>A new vendor has completed onboarding and is pending approval:</p>
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 4px 0;"><strong>Company:</strong> ${companyName}</p>
            <p style="margin: 4px 0;"><strong>Contact Person:</strong> ${vendorName}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${vendorEmail}</p>
          </div>
          <p>Please log in to the VendorBridge Admin Portal and navigate to the <strong>Vendors</strong> page to approve or deactivate this supplier.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated email from VendorBridge ERP. Please do not reply.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Sent new vendor alert to admin: ${adminEmail}`);
  } catch (error: any) {
    console.log("\n------------------------------------------------");
    console.log(`[SMTP OFFLINE/DEV] Failed to send email to ${adminEmail}: ${error.message}`);
    console.log(`[DEVELOPMENT ADMIN ALERT] New vendor ${companyName} pending approval.`);
    console.log("------------------------------------------------\n");
  }
}

// -----------------------------------------------------------------------------
// sendVendorApprovedEmail
// Notifies a vendor that their account has been approved.
// -----------------------------------------------------------------------------
export async function sendVendorApprovedEmail(email: string, companyName: string): Promise<void> {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM ?? "VendorBridge <noreply@vendorbridge.com>",
      to: email,
      subject: "Vendor Profile Approved - VendorBridge ERP Portal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 8px;">
          <h2 style="color: #2563eb; margin-bottom: 24px;">Vendor Onboarding Approved!</h2>
          <p>Dear ${companyName} Team,</p>
          <p>We are pleased to inform you that your vendor application has been <strong>approved and activated</strong>.</p>
          <p>You can now log in to the dashboard, view active RFQs, submit quotes, and track purchase orders.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Access Vendor Dashboard
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated email from VendorBridge ERP. Please do not reply.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Sent approval email to ${email}`);
  } catch (error: any) {
    console.log("\n------------------------------------------------");
    console.log(`[SMTP OFFLINE/DEV] Failed to send email to ${email}: ${error.message}`);
    console.log(`[DEVELOPMENT VENDOR APPROVED] Vendor ${companyName} approved.`);
    console.log("------------------------------------------------\n");
  }
}

// -----------------------------------------------------------------------------
// verifyEmailConnection
// Used during startup to verify SMTP configuration is correct.
// -----------------------------------------------------------------------------
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
