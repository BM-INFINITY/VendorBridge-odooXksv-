import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInvoicePDF } from "@/lib/services/pdf.service";

// GET /api/invoices/[id]/pdf
// Streams a PDFKit-generated invoice as application/pdf binary.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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

  const pdfBuffer = await generateInvoicePDF({
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt,
    vendor: invoice.vendor,
    purchaseOrder: invoice.purchaseOrder,
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.taxAmount),
    grandTotal: Number(invoice.grandTotal),
  });

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      "Content-Length": pdfBuffer.length.toString(),
    },
  });
}
