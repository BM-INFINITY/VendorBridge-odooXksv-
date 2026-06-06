import PDFDocument from "pdfkit";

// -----------------------------------------------------------------------------
// PDF Service — PDFKit wrapper
// Generates PDF documents for Invoices and Purchase Orders.
// Returns a Buffer that can be streamed via Route Handlers.
// -----------------------------------------------------------------------------

interface InvoiceData {
  invoiceNumber: string;
  issuedAt: Date | null;
  vendor: {
    vendorName: string;
    companyName: string;
    email: string;
    phone?: string | null;
    address?: string | null;
  };
  purchaseOrder: {
    poNumber: string;
    rfq: { rfqNumber: string; title: string };
  };
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
}

interface POData {
  poNumber: string;
  issueDate: Date;
  vendor: {
    vendorName: string;
    companyName: string;
    email: string;
    address?: string | null;
  };
  rfq: { rfqNumber: string; title: string };
  items: {
    itemName: string;
    quantity: number;
    unitPrice: number;
    taxPercentage: number;
    totalAmount: number;
  }[];
}

// -----------------------------------------------------------------------------
// generateInvoicePDF
// Creates a professional invoice PDF and returns a Buffer.
// -----------------------------------------------------------------------------
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // --- Header ---
    doc
      .fontSize(24)
      .fillColor("#1a56db")
      .text("VendorBridge", 50, 50)
      .fontSize(10)
      .fillColor("#6b7280")
      .text("Procurement & Vendor Management ERP", 50, 80);

    doc
      .fontSize(20)
      .fillColor("#111827")
      .text("INVOICE", 400, 50, { align: "right" })
      .fontSize(12)
      .fillColor("#374151")
      .text(`Invoice #: ${data.invoiceNumber}`, 400, 80, { align: "right" })
      .text(`Date: ${data.issuedAt ? new Date(data.issuedAt).toLocaleDateString() : "N/A"}`, 400, 96, { align: "right" });

    doc.moveDown(2);

    // --- Vendor Info ---
    doc
      .fontSize(12)
      .fillColor("#111827")
      .text("Vendor Information", 50, 130)
      .moveTo(50, 145)
      .lineTo(550, 145)
      .strokeColor("#e5e7eb")
      .stroke();

    doc
      .fontSize(10)
      .fillColor("#374151")
      .text(`Company: ${data.vendor.companyName}`, 50, 155)
      .text(`Contact: ${data.vendor.vendorName}`, 50, 170)
      .text(`Email: ${data.vendor.email}`, 50, 185)
      .text(`Address: ${data.vendor.address ?? "N/A"}`, 50, 200);

    // --- PO Reference ---
    doc
      .text(`PO Number: ${data.purchaseOrder.poNumber}`, 300, 155)
      .text(`RFQ: ${data.purchaseOrder.rfq.rfqNumber}`, 300, 170)
      .text(`Description: ${data.purchaseOrder.rfq.title}`, 300, 185);

    doc.moveDown(6);

    // --- Financials Summary ---
    const finY = 240;
    doc
      .fontSize(12)
      .fillColor("#111827")
      .text("Summary", 50, finY)
      .moveTo(50, finY + 15)
      .lineTo(550, finY + 15)
      .strokeColor("#e5e7eb")
      .stroke();

    doc
      .fontSize(10)
      .fillColor("#374151")
      .text("Subtotal:", 380, finY + 25)
      .text(`$${data.subtotal.toFixed(2)}`, 480, finY + 25, { align: "right", width: 70 });

    doc
      .text("Tax:", 380, finY + 42)
      .text(`$${data.taxAmount.toFixed(2)}`, 480, finY + 42, { align: "right", width: 70 });

    doc
      .moveTo(380, finY + 58)
      .lineTo(550, finY + 58)
      .strokeColor("#d1d5db")
      .stroke();

    doc
      .fontSize(12)
      .fillColor("#1a56db")
      .text("Grand Total:", 380, finY + 65)
      .text(`$${data.grandTotal.toFixed(2)}`, 480, finY + 65, { align: "right", width: 70 });

    // --- Footer ---
    doc
      .fontSize(8)
      .fillColor("#9ca3af")
      .text(
        "This is a computer-generated invoice. No signature required.",
        50,
        750,
        { align: "center" }
      );

    doc.end();
  });
}

// -----------------------------------------------------------------------------
// generatePOPDF
// Creates a Purchase Order PDF and returns a Buffer.
// -----------------------------------------------------------------------------
export async function generatePOPDF(data: POData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fontSize(24).fillColor("#1a56db").text("VendorBridge", 50, 50);
    doc.fontSize(20).fillColor("#111827").text("PURCHASE ORDER", 350, 50, { align: "right" });
    doc
      .fontSize(12)
      .fillColor("#374151")
      .text(`PO #: ${data.poNumber}`, 350, 80, { align: "right" })
      .text(`Date: ${new Date(data.issueDate).toLocaleDateString()}`, 350, 96, { align: "right" });

    // Vendor
    doc.fontSize(10).fillColor("#374151").text(`Vendor: ${data.vendor.companyName}`, 50, 130);
    doc.text(`RFQ: ${data.rfq.rfqNumber} — ${data.rfq.title}`, 50, 145);

    // Items Table Header
    const tableY = 175;
    doc
      .fontSize(10)
      .fillColor("#fff")
      .rect(50, tableY, 500, 18)
      .fill("#1a56db")
      .fillColor("#fff")
      .text("Item", 55, tableY + 4)
      .text("Qty", 300, tableY + 4)
      .text("Unit Price", 360, tableY + 4)
      .text("Tax %", 430, tableY + 4)
      .text("Total", 490, tableY + 4);

    let rowY = tableY + 20;
    data.items.forEach((item, i) => {
      const bg = i % 2 === 0 ? "#f9fafb" : "#ffffff";
      doc.rect(50, rowY, 500, 18).fill(bg);
      doc
        .fillColor("#374151")
        .text(item.itemName, 55, rowY + 4, { width: 240 })
        .text(item.quantity.toString(), 300, rowY + 4)
        .text(`$${item.unitPrice.toFixed(2)}`, 360, rowY + 4)
        .text(`${item.taxPercentage}%`, 430, rowY + 4)
        .text(`$${item.totalAmount.toFixed(2)}`, 490, rowY + 4);
      rowY += 20;
    });

    doc.end();
  });
}
