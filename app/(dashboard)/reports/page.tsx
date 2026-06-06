import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { getReportKPIs } from "@/lib/services/report.service";

export const metadata: Metadata = { title: "Reports & Analytics" };

export default async function ReportsPage() {
  const kpis = await getReportKPIs();

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Procurement performance insights and spending analytics." />
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Analytics charts loading... (Total Spend: ${kpis.totalSpend.toFixed(2)})
        </p>
      </div>
    </div>
  );
}
