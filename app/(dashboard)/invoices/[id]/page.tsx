import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Invoice" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      vendor: true,
      purchaseOrder: { include: { items: true, rfq: true } },
    },
  });
  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description={`Vendor: ${invoice.vendor.companyName}`}
      />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Invoice document loading...</p>
      </div>
    </div>
  );
}
