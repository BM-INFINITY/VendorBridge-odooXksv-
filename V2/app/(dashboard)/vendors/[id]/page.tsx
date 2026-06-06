import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Vendor Details" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VendorDetailPage({ params }: Props) {
  const { id } = await params;
  const vendor = await db.vendor.findUnique({ where: { id } });
  if (!vendor) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={vendor.vendorName}
        description={vendor.companyName}
      />
      {/* VendorDetailCard and VendorForm will be rendered here in Phase 3 */}
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Vendor details loading...</p>
      </div>
    </div>
  );
}
