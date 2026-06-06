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
