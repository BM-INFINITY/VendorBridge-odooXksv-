"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { vendorSchema } from "@/lib/validations/vendor.validation";
import { logActivity } from "./activity.actions";
import type { ActionResponse } from "./auth.actions";

// -----------------------------------------------------------------------------
// createVendor
// Allowed roles: ADMIN, PROCUREMENT_OFFICER
// -----------------------------------------------------------------------------
export async function createVendor(formData: FormData): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (!["ADMIN", "PROCUREMENT_OFFICER"].includes((session.user as any).role)) {
    return { success: false, error: "Forbidden" };
  }

  const raw = {
    vendorName: formData.get("vendorName"),
    companyName: formData.get("companyName"),
    contactPerson: formData.get("contactPerson"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    status: formData.get("status") || undefined,
  };

  const parsed = vendorSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const existing = await db.vendor.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { success: false, error: "A vendor with this email already exists." };
  }

  const vendor = await db.vendor.create({
    data: { ...parsed.data, createdById: session.user.id! },
  });

  await logActivity({
    userId: session.user.id!,
    action: "VENDOR_CREATED",
    module: "VENDOR",
    entityId: vendor.id,
    metadata: { vendorName: vendor.vendorName, email: vendor.email },
  });

  revalidatePath("/vendors");
  return { success: true, data: { id: vendor.id } };
}

// -----------------------------------------------------------------------------
// updateVendor
// Allowed roles: ADMIN, PROCUREMENT_OFFICER
// -----------------------------------------------------------------------------
export async function updateVendor(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (!["ADMIN", "PROCUREMENT_OFFICER"].includes((session.user as any).role)) {
    return { success: false, error: "Forbidden" };
  }

  const raw = {
    vendorName: formData.get("vendorName"),
    companyName: formData.get("companyName"),
    contactPerson: formData.get("contactPerson"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    status: formData.get("status") || undefined,
  };

  const parsed = vendorSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const vendor = await db.vendor.update({
    where: { id },
    data: parsed.data,
  });

  await logActivity({
    userId: session.user.id!,
    action: "VENDOR_UPDATED",
    module: "VENDOR",
    entityId: vendor.id,
    metadata: { vendorName: vendor.vendorName },
  });

  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
  return { success: true };
}

// -----------------------------------------------------------------------------
// deleteVendor
// Allowed roles: ADMIN
// -----------------------------------------------------------------------------
export async function deleteVendor(id: string): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if ((session.user as any).role !== "ADMIN") {
    return { success: false, error: "Only admins can delete vendors." };
  }

  const vendor = await db.vendor.delete({ where: { id } });

  await logActivity({
    userId: session.user.id!,
    action: "VENDOR_DELETED",
    module: "VENDOR",
    entityId: id,
    metadata: { vendorName: vendor.vendorName },
  });

  revalidatePath("/vendors");
  return { success: true };
}

// -----------------------------------------------------------------------------
// getVendors
// -----------------------------------------------------------------------------
export async function getVendors(
  status?: string,
  page: number = 1,
  pageSize: number = 20
) {
  const where = status ? { status: status as any } : {};
  const [vendors, total] = await Promise.all([
    db.vendor.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.vendor.count({ where }),
  ]);

  return { vendors, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
