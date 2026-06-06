import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Approval Queue" description="Review and process pending approval requests." />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Approval queue loading...</p>
      </div>
    </div>
  );
}
