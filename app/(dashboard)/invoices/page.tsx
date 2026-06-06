import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Manage and distribute procurement invoices." />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Invoices table loading...</p>
      </div>
    </div>
  );
}
