"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardKPIs = getDashboardKPIs;
exports.getReportKPIs = getReportKPIs;
exports.getSpendByCategory = getSpendByCategory;
exports.getTopVendors = getTopVendors;
exports.getMonthlySpendTrend = getMonthlySpendTrend;
const db_1 = require("../db");
// -----------------------------------------------------------------------------
// Report Service
// All aggregated queries for the Reports & Analytics module.
// Used by /reports page (RSC) and /api/reports/export route handler.
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// getDashboardKPIs
// Fast summary counts for the Dashboard page.
// -----------------------------------------------------------------------------
async function getDashboardKPIs() {
    const [activeRFQs, pendingApprovals, vendorCount, totalSpend] = await Promise.all([
        db_1.db.rFQ.count({ where: { status: { in: ["DRAFT", "PUBLISHED"] } } }),
        db_1.db.approval.count({ where: { status: "PENDING" } }),
        db_1.db.vendor.count({ where: { status: "ACTIVE" } }),
        db_1.db.invoice.aggregate({
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
async function getReportKPIs() {
    const [totalSpend, activeVendors, rfqsProcessed, pendingApprovals] = await Promise.all([
        db_1.db.invoice.aggregate({ _sum: { grandTotal: true } }),
        db_1.db.vendor.count({ where: { status: "ACTIVE" } }),
        db_1.db.rFQ.count({ where: { status: "CLOSED" } }),
        db_1.db.approval.count({ where: { status: "PENDING" } }),
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
async function getSpendByCategory() {
    const data = await db_1.db.$queryRaw `
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
async function getTopVendors(limit = 5) {
    const data = await db_1.db.$queryRaw `
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
async function getMonthlySpendTrend(year) {
    const targetYear = year ?? new Date().getFullYear();
    const data = await db_1.db.$queryRaw `
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
