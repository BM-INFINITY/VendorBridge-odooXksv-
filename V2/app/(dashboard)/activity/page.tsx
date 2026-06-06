import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { getActivityLogs } from "@/lib/actions/activity.actions";

export const metadata: Metadata = { title: "Activity Log" };

export default async function ActivityPage() {
  const { logs, total } = await getActivityLogs(undefined, 1, 20);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description={`Procurement audit trail — ${total} events recorded`}
      />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Activity feed loading...</p>
      </div>
    </div>
  );
}
