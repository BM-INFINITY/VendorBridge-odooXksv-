"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quotationSchema } from "@/lib/validations/quotation.validation";
import { logActivity } from "./activity.actions";
import { submitForApproval } from "./approval.actions";
import type { ActionResponse } from "./auth.actions";

// -----------------------------------------------------------------------------
// Helper: Calculate totals for quotation items
// -----------------------------------------------------------------------------
function calculateItemTotal(unitPrice: number, quantity: number, taxPct: number): number {
  const subtotal = unitPrice * quantity;
  const tax = (subtotal * taxPct) / 100;
  return subtotal + tax;
}

// -----------------------------------------------------------------------------
// saveDraftQuotation
// Upsert quotation with status DRAFT.
// Allowed roles: VENDOR
// -----------------------------------------------------------------------------
export async function saveDraftQuotation(
  data: unknown
): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = quotationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Find the vendor associated with this user's email
  const vendor = await db.vendor.findUnique({
    where: { email: session.user.email! },
  });
  if (!vendor) return { success: false, error: "Vendor record not found for this user." };

  const totalAmount = parsed.data.items.reduce((sum, item) => {
    return sum + calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage);
  }, 0);

  const quotation = await db.quotation.upsert({
    where: { rfqId_vendorId: { rfqId: parsed.data.rfqId, vendorId: vendor.id } },
    update: {
      deliveryTimeline: parsed.data.deliveryTimeline,
      notes: parsed.data.notes,
      totalAmount,
      status: "DRAFT",
      items: {
        deleteMany: {},
        create: parsed.data.items.map((item) => ({
          rfqItemId: item.rfqItemId,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          taxPercentage: item.taxPercentage,
          totalAmount: calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage),
        })),
      },
    },
    create: {
      rfqId: parsed.data.rfqId,
      vendorId: vendor.id,
      deliveryTimeline: parsed.data.deliveryTimeline,
      notes: parsed.data.notes,
      totalAmount,
      status: "DRAFT",
      items: {
        create: parsed.data.items.map((item) => ({
          rfqItemId: item.rfqItemId,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          taxPercentage: item.taxPercentage,
          totalAmount: calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage),
        })),
      },
    },
  });

  revalidatePath("/quotations");
  return { success: true, data: { id: quotation.id } };
}

// -----------------------------------------------------------------------------
// submitQuotation
// Upsert quotation with status SUBMITTED.
// Allowed roles: VENDOR
// -----------------------------------------------------------------------------
export async function submitQuotation(
  data: unknown
): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = quotationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const vendor = await db.vendor.findUnique({
    where: { email: session.user.email! },
  });
  if (!vendor) return { success: false, error: "Vendor record not found." };

  const totalAmount = parsed.data.items.reduce((sum, item) => {
    return sum + calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage);
  }, 0);

  const quotation = await db.quotation.upsert({
    where: { rfqId_vendorId: { rfqId: parsed.data.rfqId, vendorId: vendor.id } },
    update: {
      deliveryTimeline: parsed.data.deliveryTimeline,
      notes: parsed.data.notes,
      totalAmount,
      status: "SUBMITTED",
      submittedAt: new Date(),
      items: {
        deleteMany: {},
        create: parsed.data.items.map((item) => ({
          rfqItemId: item.rfqItemId,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          taxPercentage: item.taxPercentage,
          totalAmount: calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage),
        })),
      },
    },
    create: {
      rfqId: parsed.data.rfqId,
      vendorId: vendor.id,
      deliveryTimeline: parsed.data.deliveryTimeline,
      notes: parsed.data.notes,
      totalAmount,
      status: "SUBMITTED",
      submittedAt: new Date(),
      items: {
        create: parsed.data.items.map((item) => ({
          rfqItemId: item.rfqItemId,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          taxPercentage: item.taxPercentage,
          totalAmount: calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage),
        })),
      },
    },
  });

  await logActivity({
    userId: session.user.id!,
    action: "QUOTATION_SUBMITTED",
    module: "QUOTATION",
    entityId: quotation.id,
    metadata: { rfqId: parsed.data.rfqId, totalAmount },
  });

  revalidatePath("/quotations");
  return { success: true, data: { id: quotation.id } };
}

// -----------------------------------------------------------------------------
// selectQuotation
// Mark one quotation as SELECTED, all others for the same RFQ as REJECTED.
// Then automatically submit for approval.
// Allowed roles: ADMIN, PROCUREMENT_OFFICER
// -----------------------------------------------------------------------------
export async function selectQuotation(
  quotationId: string
): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (!["ADMIN", "PROCUREMENT_OFFICER"].includes((session.user as any).role)) {
    return { success: false, error: "Forbidden" };
  }

  const quotation = await db.quotation.findUnique({ where: { id: quotationId } });
  if (!quotation) return { success: false, error: "Quotation not found." };

  // Reject all other quotations for this RFQ
  await db.quotation.updateMany({
    where: { rfqId: quotation.rfqId, id: { not: quotationId } },
    data: { status: "REJECTED" },
  });

  // Select this quotation
  await db.quotation.update({
    where: { id: quotationId },
    data: { status: "SELECTED" },
  });

  await logActivity({
    userId: session.user.id!,
    action: "QUOTATION_SELECTED",
    module: "QUOTATION",
    entityId: quotationId,
    metadata: { rfqId: quotation.rfqId },
  });

  // Auto-submit to approval workflow
  await submitForApproval(quotationId, quotation.rfqId);

  revalidatePath(`/rfqs/${quotation.rfqId}/compare`);
  revalidatePath("/quotations");
  return { success: true };
}

// -----------------------------------------------------------------------------
// rejectQuotation
// Mark a single quotation as REJECTED.
// Allowed roles: ADMIN, PROCUREMENT_OFFICER
// -----------------------------------------------------------------------------
export async function rejectQuotation(
  quotationId: string
): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await db.quotation.update({
    where: { id: quotationId },
    data: { status: "REJECTED" },
  });

  await logActivity({
    userId: session.user.id!,
    action: "QUOTATION_REJECTED",
    module: "QUOTATION",
    entityId: quotationId,
    metadata: {},
  });

  revalidatePath("/quotations");
  return { success: true };
}
