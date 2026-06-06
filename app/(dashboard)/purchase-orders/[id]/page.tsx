import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Purchase Order" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PODetailPage({ params }: Props) {
  const { id } = await params;
  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      rfq: true,
      items: true,
      invoice: true,
    },
  });
  if (!po) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Purchase Order ${po.poNumber}`} description={`Vendor: ${po.vendor.companyName}`} />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">PO document loading...</p>
      </div>
    </div>
  );
}
