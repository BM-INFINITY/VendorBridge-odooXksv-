import type { Metadata } from "next";
import { getDashboardKPIs } from "@/lib/services/report.service";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { BarChart3, Package, Users, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const kpis = await getDashboardKPIs();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your procurement activities"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active RFQs"
          value={kpis.activeRFQs}
          icon={<Package className="h-4 w-4" />}
          description="Open requests for quotation"
        />
        <StatCard
          title="Pending Approvals"
          value={kpis.pendingApprovals}
          icon={<Clock className="h-4 w-4" />}
          description="Awaiting manager review"
        />
        <StatCard
          title="Procurement Spend"
          value={formatCurrency(kpis.totalSpend)}
          icon={<BarChart3 className="h-4 w-4" />}
          description="Total approved spend"
        />
        <StatCard
          title="Active Vendors"
          value={kpis.vendorCount}
          icon={<Users className="h-4 w-4" />}
          description="Registered active vendors"
        />
      </div>

      {/* Placeholder for charts and overview table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Procurement Overview
          </h3>
          <p className="text-sm text-muted-foreground">
            Recent procurement activities will appear here.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Analytics
          </h3>
          <p className="text-sm text-muted-foreground">
            Spend analytics charts will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
