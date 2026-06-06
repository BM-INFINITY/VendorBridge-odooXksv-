"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "./activity.actions";
import { generatePurchaseOrder } from "./purchase-order.actions";
import type { ActionResponse } from "./auth.actions";

// -----------------------------------------------------------------------------
// submitForApproval
// Creates an approval record (PENDING) for a selected quotation.
// Called internally from selectQuotation() — not directly from UI.
// -----------------------------------------------------------------------------
export async function submitForApproval(
  quotationId: string,
  rfqId: string
): Promise<void> {
  // Check no existing approval for this quotation
  const existing = await db.approval.findUnique({ where: { quotationId } });
  if (existing) return;

  const session = await auth();

  await db.approval.create({
    data: {
      quotationId,
      rfqId,
      status: "PENDING",
    },
  });

  if (session?.user?.id) {
    await logActivity({
      userId: session.user.id,
      action: "APPROVAL_REQUESTED",
      module: "APPROVAL",
      entityId: quotationId,
      metadata: { rfqId, quotationId },
    });
  }

  revalidatePath("/approvals");
}

// -----------------------------------------------------------------------------
// approveRequest
// Set approval status to APPROVED, store remarks, trigger PO generation.
// Allowed roles: ADMIN, MANAGER
// -----------------------------------------------------------------------------
export async function approveRequest(
  approvalId: string,
  remarks?: string
): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (!["ADMIN", "MANAGER"].includes((session.user as any).role)) {
    return { success: false, error: "Forbidden: Only Managers or Admins can approve." };
  }

  const approval = await db.approval.update({
    where: { id: approvalId },
    data: {
      status: "APPROVED",
      remarks: remarks ?? null,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
    include: {
      quotation: { include: { vendor: true } },
      rfq: true,
    },
  });

  await logActivity({
    userId: session.user.id!,
    action: "APPROVAL_GRANTED",
    module: "APPROVAL",
    entityId: approvalId,
    metadata: { remarks, rfqId: approval.rfqId },
  });

  // Automatically generate Purchase Order
  await generatePurchaseOrder(approvalId);

  revalidatePath("/approvals");
  revalidatePath(`/approvals/${approvalId}`);
  return { success: true };
}

// -----------------------------------------------------------------------------
// rejectRequest
// Set approval status to REJECTED, store remarks.
// Allowed roles: ADMIN, MANAGER
// -----------------------------------------------------------------------------
export async function rejectRequest(
  approvalId: string,
  remarks?: string
): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (!["ADMIN", "MANAGER"].includes((session.user as any).role)) {
    return { success: false, error: "Forbidden: Only Managers or Admins can reject." };
  }

  await db.approval.update({
    where: { id: approvalId },
    data: {
      status: "REJECTED",
      remarks: remarks ?? null,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });

  await logActivity({
    userId: session.user.id!,
    action: "APPROVAL_REJECTED",
    module: "APPROVAL",
    entityId: approvalId,
    metadata: { remarks },
  });

  revalidatePath("/approvals");
  revalidatePath(`/approvals/${approvalId}`);
  return { success: true };
}
