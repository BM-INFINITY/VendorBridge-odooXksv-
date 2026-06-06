import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInvoicePDF } from "@/lib/services/pdf.service";
import { sendInvoiceEmail } from "@/lib/services/email.service";
import { updateInvoiceStatus } from "@/lib/actions/invoice.actions";

// POST /api/invoices/[id]/email
// Generates the invoice PDF and sends it via Nodemailer to the specified email.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json() as { email?: string };

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      vendor: true,
      purchaseOrder: { include: { rfq: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const recipientEmail = body.email ?? invoice.vendor.email;

  // Generate PDF
  const pdfBuffer = await generateInvoicePDF({
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt,
    vendor: invoice.vendor,
    purchaseOrder: invoice.purchaseOrder,
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.taxAmount),
    grandTotal: Number(invoice.grandTotal),
  });

  // Send email
  await sendInvoiceEmail({
    to: recipientEmail,
    invoiceNumber: invoice.invoiceNumber,
    vendorName: invoice.vendor.vendorName,
    grandTotal: Number(invoice.grandTotal),
    pdfBuffer,
  });

  // Update invoice status to SENT
  await updateInvoiceStatus(id, "SENT");

  return NextResponse.json({ success: true, sentTo: recipientEmail });
}
