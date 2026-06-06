import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Approval" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApprovalDetailPage({ params }: Props) {
  const { id } = await params;
  const approval = await db.approval.findUnique({
    where: { id },
    include: {
      quotation: { include: { vendor: true, items: true } },
      rfq: true,
      reviewedBy: true,
    },
  });
  if (!approval) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Request"
        description={`RFQ: ${approval.rfq.rfqNumber} — ${approval.rfq.title}`}
      />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Approval details loading...</p>
      </div>
    </div>
  );
}
