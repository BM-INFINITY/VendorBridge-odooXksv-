import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "RFQ Details" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RFQDetailPage({ params }: Props) {
  const { id } = await params;
  const rfq = await db.rFQ.findUnique({
    where: { id },
    include: { items: true, vendors: { include: { vendor: true } } },
  });
  if (!rfq) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={rfq.title} description={`RFQ #${rfq.rfqNumber}`} />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">RFQ details loading...</p>
      </div>
    </div>
  );
}
