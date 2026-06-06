"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "./activity.actions";
import { generateDocumentNumber } from "@/lib/utils";
import type { ActionResponse } from "./auth.actions";
import type { POStatus } from "@prisma/client";

// -----------------------------------------------------------------------------
// generatePurchaseOrder
// Auto-called by approveRequest(). Creates PO + items from approved quotation.
// -----------------------------------------------------------------------------
export async function generatePurchaseOrder(
  approvalId: string
): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  // Load the approval with all nested data needed
  const approval = await db.approval.findUnique({
    where: { id: approvalId },
    include: {
      quotation: {
        include: {
          items: {
            include: { rfqItem: true },
          },
          vendor: true,
        },
      },
      rfq: true,
    },
  });

  if (!approval) return { success: false, error: "Approval not found." };
  if (approval.status !== "APPROVED") {
    return { success: false, error: "Cannot generate PO for non-approved request." };
  }

  // Check no PO exists yet for this approval
  const existingPO = await db.purchaseOrder.findUnique({
    where: { approvalId },
  });
  if (existingPO) return { success: true, data: { id: existingPO.id } };

  // Generate PO number
  const poCount = await db.purchaseOrder.count();
  const poNumber = generateDocumentNumber("PO", poCount);

  const po = await db.purchaseOrder.create({
    data: {
      poNumber,
      approvalId,
      vendorId: approval.quotation.vendorId,
      rfqId: approval.rfqId,
      status: "ISSUED",
      issueDate: new Date(),
      createdById: session.user.id!,
      items: {
        create: approval.quotation.items.map((item) => ({
          itemName: item.rfqItem.itemName,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxPercentage: Number(item.taxPercentage),
          totalAmount: Number(item.totalAmount),
        })),
      },
    },
  });

  await logActivity({
    userId: session.user.id!,
    action: "PO_GENERATED",
    module: "PURCHASE_ORDER",
    entityId: po.id,
    metadata: { poNumber: po.poNumber, approvalId },
  });

  revalidatePath("/purchase-orders");
  return { success: true, data: { id: po.id } };
}

// -----------------------------------------------------------------------------
// updatePOStatus
// Transition PO status: ISSUED → ACKNOWLEDGED → COMPLETED.
// Allowed roles: ADMIN, PROCUREMENT_OFFICER
// -----------------------------------------------------------------------------
export async function updatePOStatus(
  id: string,
  status: POStatus
): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (!["ADMIN", "PROCUREMENT_OFFICER"].includes((session.user as any).role)) {
    return { success: false, error: "Forbidden" };
  }

  const po = await db.purchaseOrder.update({
    where: { id },
    data: { status },
  });

  await logActivity({
    userId: session.user.id!,
    action: "PO_STATUS_UPDATED",
    module: "PURCHASE_ORDER",
    entityId: id,
    metadata: { poNumber: po.poNumber, status },
  });

  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${id}`);
  return { success: true };
}
