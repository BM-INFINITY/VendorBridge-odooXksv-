import { db } from "../db";
import { logActivity } from "./activity.service";
import { generateDocumentNumber } from "../utils";

export async function generateInvoice(
  poId: string,
  userId: string
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  // Check if invoice already exists for this PO
  const existingInvoice = await db.invoice.findUnique({ where: { poId } });
  if (existingInvoice) {
    return { success: true, data: { id: existingInvoice.id } };
  }

  // Load PO with items
  const po = await db.purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: true, vendor: true },
  });
  if (!po) return { success: false, error: "Purchase Order not found." };

  // Calculate financials
  const subtotal = po.items.reduce((sum, item) => {
    const itemSubtotal = Number(item.unitPrice) * Number(item.quantity);
    return sum + itemSubtotal;
  }, 0);

  const taxAmount = po.items.reduce((sum, item) => {
    const itemSubtotal = Number(item.unitPrice) * Number(item.quantity);
    return sum + (itemSubtotal * Number(item.taxPercentage)) / 100;
  }, 0);

  const grandTotal = subtotal + taxAmount;

  // Generate invoice number
  const invoiceCount = await db.invoice.count();
  const invoiceNumber = generateDocumentNumber("INV", invoiceCount);

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      poId,
      vendorId: po.vendorId,
      subtotal,
      taxAmount,
      grandTotal,
      status: "GENERATED",
      issuedAt: new Date(),
    },
  });

  await logActivity({
    userId,
    action: "INVOICE_GENERATED",
    module: "INVOICE",
    entityId: invoice.id,
    metadata: { invoiceNumber: invoice.invoiceNumber, grandTotal, poId },
  });

  return { success: true, data: { id: invoice.id } };
}
