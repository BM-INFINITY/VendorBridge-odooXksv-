import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Quotations" };

export default async function QuotationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Quotations" description="View and manage submitted quotations." />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Quotations table loading...</p>
      </div>
    </div>
  );
}
