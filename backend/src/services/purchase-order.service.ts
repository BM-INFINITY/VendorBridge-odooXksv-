import { db } from "../db";
import { logActivity } from "./activity.service";
import { generateDocumentNumber } from "../utils";

export async function generatePurchaseOrder(
  approvalId: string,
  userId: string
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  // Load the approval with nested data
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

  // Check if PO exists already
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
      createdById: userId,
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
    userId,
    action: "PO_GENERATED",
    module: "PURCHASE_ORDER",
    entityId: po.id,
    metadata: { poNumber: po.poNumber, approvalId },
  });

  return { success: true, data: { id: po.id } };
}
