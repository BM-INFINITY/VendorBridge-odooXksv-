import { db } from "../db";

// -----------------------------------------------------------------------------
// Report Service
// All aggregated queries for the Reports & Analytics module.
// Used by /reports page (RSC) and /api/reports/export route handler.
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// getDashboardKPIs
// Fast summary counts for the Dashboard page.
// -----------------------------------------------------------------------------
export async function getDashboardKPIs() {
  const [activeRFQs, pendingApprovals, vendorCount, totalSpend] = await Promise.all([
    db.rFQ.count({ where: { status: { in: ["DRAFT", "PUBLISHED"] } } }),
    db.approval.count({ where: { status: "PENDING" } }),
    db.vendor.count({ where: { status: "ACTIVE" } }),
    db.invoice.aggregate({
      _sum: { grandTotal: true },
      where: { status: { not: "GENERATED" } },
    }),
  ]);

  return {
    activeRFQs,
    pendingApprovals,
    vendorCount,
    totalSpend: Number(totalSpend._sum.grandTotal ?? 0),
  };
}

// -----------------------------------------------------------------------------
// getReportKPIs
// Detailed KPIs for the Reports page.
// -----------------------------------------------------------------------------
export async function getReportKPIs() {
  const [totalSpend, activeVendors, rfqsProcessed, pendingApprovals] =
    await Promise.all([
      db.invoice.aggregate({ _sum: { grandTotal: true } }),
      db.vendor.count({ where: { status: "ACTIVE" } }),
      db.rFQ.count({ where: { status: "CLOSED" } }),
      db.approval.count({ where: { status: "PENDING" } }),
    ]);

  return {
    totalSpend: Number(totalSpend._sum.grandTotal ?? 0),
    activeVendors,
    rfqsProcessed,
    pendingApprovals,
  };
}

// -----------------------------------------------------------------------------
// getSpendByCategory
// Spending grouped by RFQ category.
// -----------------------------------------------------------------------------
export async function getSpendByCategory() {
  const data = await db.$queryRaw<{ category: string; total: number }[]>`
    SELECT 
      COALESCE(r.category, 'Uncategorized') as category,
      SUM(i.grand_total)::float as total
    FROM invoices i
    JOIN purchase_orders po ON po.id = i.po_id
    JOIN rfqs r ON r.id = po.rfq_id
    GROUP BY r.category
    ORDER BY total DESC
    LIMIT 10
  `;
  return data;
}

// -----------------------------------------------------------------------------
// getTopVendors
// Top vendors by total spend.
// -----------------------------------------------------------------------------
export async function getTopVendors(limit: number = 5) {
  const data = await db.$queryRaw<
    { vendorName: string; companyName: string; totalSpend: number; poCount: number }[]
  >`
    SELECT 
      v.vendor_name as "vendorName",
      v.company_name as "companyName",
      SUM(i.grand_total)::float as "totalSpend",
      COUNT(po.id)::int as "poCount"
    FROM vendors v
    JOIN purchase_orders po ON po.vendor_id = v.id
    JOIN invoices i ON i.po_id = po.id
    GROUP BY v.id, v.vendor_name, v.company_name
    ORDER BY "totalSpend" DESC
    LIMIT ${limit}
  `;
  return data;
}

// -----------------------------------------------------------------------------
// getMonthlySpendTrend
// Monthly procurement spend for the current year.
// -----------------------------------------------------------------------------
export async function getMonthlySpendTrend(year?: number) {
  const targetYear = year ?? new Date().getFullYear();
  const data = await db.$queryRaw<{ month: number; total: number }[]>`
    SELECT 
      EXTRACT(MONTH FROM i.created_at)::int as month,
      SUM(i.grand_total)::float as total
    FROM invoices i
    WHERE EXTRACT(YEAR FROM i.created_at) = ${targetYear}
    GROUP BY EXTRACT(MONTH FROM i.created_at)
    ORDER BY month ASC
  `;
  return data;
}
