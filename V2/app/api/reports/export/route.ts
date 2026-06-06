import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getReportKPIs,
  getSpendByCategory,
  getTopVendors,
  getMonthlySpendTrend,
} from "@/lib/services/report.service";

// GET /api/reports/export
// Exports aggregated report data as JSON (extendable to CSV).
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;

  const [kpis, spendByCategory, topVendors, monthlyTrend] = await Promise.all([
    getReportKPIs(),
    getSpendByCategory(),
    getTopVendors(10),
    getMonthlySpendTrend(year),
  ]);

  const reportData = { kpis, spendByCategory, topVendors, monthlyTrend };

  if (format === "json") {
    return NextResponse.json(reportData);
  }

  // CSV format (basic)
  const csv = [
    "Category,Total Spend",
    ...spendByCategory.map((r) => `"${r.category}",${r.total}`),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="vendorbridge-report-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
