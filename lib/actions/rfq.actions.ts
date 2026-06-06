"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rfqSchema } from "@/lib/validations/rfq.validation";
import { logActivity } from "./activity.actions";
import { generateDocumentNumber } from "@/lib/utils";
import type { ActionResponse } from "./auth.actions";

// -----------------------------------------------------------------------------
// createRFQ
// Allowed roles: ADMIN, PROCUREMENT_OFFICER
// -----------------------------------------------------------------------------
export async function createRFQ(data: {
  title: string;
  description?: string;
  category?: string;
  deadline?: Date;
  vendorIds: string[];
  items: { itemName: string; quantity: number; unit?: string }[];
}): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (!["ADMIN", "PROCUREMENT_OFFICER"].includes((session.user as any).role)) {
    return { success: false, error: "Forbidden" };
  }

  const parsed = rfqSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Generate RFQ number
  const rfqCount = await db.rFQ.count();
  const rfqNumber = generateDocumentNumber("RFQ", rfqCount);

  const rfq = await db.rFQ.create({
    data: {
      rfqNumber,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      deadline: parsed.data.deadline,
      status: "DRAFT",
      createdById: session.user.id!,
      items: {
        create: parsed.data.items.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
        })),
      },
      vendors: {
        create: parsed.data.vendorIds.map((vendorId) => ({ vendorId })),
      },
    },
  });

  await logActivity({
    userId: session.user.id!,
    action: "RFQ_CREATED",
    module: "RFQ",
    entityId: rfq.id,
    metadata: { rfqNumber: rfq.rfqNumber, title: rfq.title },
  });

  revalidatePath("/rfqs");
  return { success: true, data: { id: rfq.id } };
}

// -----------------------------------------------------------------------------
// publishRFQ
// Changes status from DRAFT → PUBLISHED.
// Allowed roles: ADMIN, PROCUREMENT_OFFICER
// -----------------------------------------------------------------------------
export async function publishRFQ(id: string): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (!["ADMIN", "PROCUREMENT_OFFICER"].includes((session.user as any).role)) {
    return { success: false, error: "Forbidden" };
  }

  const rfq = await db.rFQ.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });

  await logActivity({
    userId: session.user.id!,
    action: "RFQ_PUBLISHED",
    module: "RFQ",
    entityId: rfq.id,
    metadata: { rfqNumber: rfq.rfqNumber },
  });

  revalidatePath("/rfqs");
  revalidatePath(`/rfqs/${id}`);
  return { success: true };
}

// -----------------------------------------------------------------------------
// closeRFQ
// Changes status to CLOSED.
// Allowed roles: ADMIN, PROCUREMENT_OFFICER
// -----------------------------------------------------------------------------
export async function closeRFQ(id: string): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const rfq = await db.rFQ.update({
    where: { id },
    data: { status: "CLOSED" },
  });

  await logActivity({
    userId: session.user.id!,
    action: "RFQ_CLOSED",
    module: "RFQ",
    entityId: rfq.id,
    metadata: { rfqNumber: rfq.rfqNumber },
  });

  revalidatePath("/rfqs");
  revalidatePath(`/rfqs/${id}`);
  return { success: true };
}
