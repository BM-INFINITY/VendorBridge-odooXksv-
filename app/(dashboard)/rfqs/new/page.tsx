import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Create RFQ" };

export default function NewRFQPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Create RFQ" description="Create a new Request for Quotation." />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">RFQ creation form loading...</p>
      </div>
    </div>
  );
}
