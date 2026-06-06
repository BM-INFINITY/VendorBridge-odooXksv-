import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Purchase Orders" };

export default async function PurchaseOrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Orders" description="Track and manage generated purchase orders." />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Purchase orders table loading...</p>
      </div>
    </div>
  );
}
