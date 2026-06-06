import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Compare Quotations" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompareQuotationsPage({ params }: Props) {
  const { id } = await params;
  const rfq = await db.rFQ.findUnique({
    where: { id },
    include: {
      quotations: {
        include: {
          vendor: true,
          items: { include: { rfqItem: true } },
        },
        where: { status: "SUBMITTED" },
      },
    },
  });
  if (!rfq) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compare Quotations"
        description={`Comparing quotations for: ${rfq.title}`}
      />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Quotation comparison table loading... ({rfq.quotations.length} submitted)
        </p>
      </div>
    </div>
  );
}
