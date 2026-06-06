"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "./activity.actions";
import { generateDocumentNumber } from "@/lib/utils";
import type { ActionResponse } from "./auth.actions";

// -----------------------------------------------------------------------------
// generateInvoice
// Creates an invoice record from a Purchase Order.
// Allowed roles: ADMIN, PROCUREMENT_OFFICER
// -----------------------------------------------------------------------------
export async function generateInvoice(
  poId: string
): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (!["ADMIN", "PROCUREMENT_OFFICER"].includes((session.user as any).role)) {
    return { success: false, error: "Forbidden" };
  }

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
    userId: session.user.id!,
    action: "INVOICE_GENERATED",
    module: "INVOICE",
    entityId: invoice.id,
    metadata: { invoiceNumber: invoice.invoiceNumber, grandTotal, poId },
  });

  revalidatePath("/invoices");
  return { success: true, data: { id: invoice.id } };
}

// -----------------------------------------------------------------------------
// updateInvoiceStatus
// Transition invoice status: GENERATED → SENT → PAID.
// -----------------------------------------------------------------------------
export async function updateInvoiceStatus(
  id: string,
  status: "GENERATED" | "SENT" | "PAID"
): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await db.invoice.update({ where: { id }, data: { status } });

  await logActivity({
    userId: session.user.id!,
    action: "INVOICE_STATUS_UPDATED",
    module: "INVOICE",
    entityId: id,
    metadata: { status },
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return { success: true };
}
