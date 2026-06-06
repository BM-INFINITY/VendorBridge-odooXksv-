import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Quotation" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuotationDetailPage({ params }: Props) {
  const { id } = await params;
  const quotation = await db.quotation.findUnique({
    where: { id },
    include: { rfq: { include: { items: true } }, vendor: true, items: true },
  });
  if (!quotation) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotation"
        description={`For RFQ: ${quotation.rfq.rfqNumber} — ${quotation.rfq.title}`}
      />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Quotation form loading...</p>
      </div>
    </div>
  );
}
