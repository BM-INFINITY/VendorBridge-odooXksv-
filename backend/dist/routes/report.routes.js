"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const report_service_1 = require("../services/report.service");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// GET /api/reports/dashboard - Dashboard KPIs
router.get("/dashboard", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const kpis = await (0, report_service_1.getDashboardKPIs)();
        res.json({ success: true, data: kpis });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch dashboard KPIs" });
    }
});
// GET /api/reports/kpis - Report Page KPIs
router.get("/kpis", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.MANAGER]), async (req, res) => {
    try {
        const kpis = await (0, report_service_1.getReportKPIs)();
        res.json({ success: true, data: kpis });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch report KPIs" });
    }
});
// GET /api/reports/spend-by-category - Category Spend chart data
router.get("/spend-by-category", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.MANAGER]), async (req, res) => {
    try {
        const data = await (0, report_service_1.getSpendByCategory)();
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch category spend" });
    }
});
// GET /api/reports/top-vendors - Top Vendors chart data
router.get("/top-vendors", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.MANAGER]), async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
        const data = await (0, report_service_1.getTopVendors)(limit);
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch top vendors" });
    }
});
// GET /api/reports/spend-trend - Monthly spend trend
router.get("/spend-trend", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.MANAGER]), async (req, res) => {
    try {
        const year = req.query.year ? parseInt(String(req.query.year)) : undefined;
        const data = await (0, report_service_1.getMonthlySpendTrend)(year);
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch spend trend" });
    }
});
// GET /api/reports/export - Export reports as JSON or CSV
router.get("/export", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.MANAGER]), async (req, res) => {
    try {
        const format = req.query.format ?? "json";
        const year = req.query.year ? parseInt(String(req.query.year)) : undefined;
        const [kpis, spendByCategory, topVendors, monthlyTrend] = await Promise.all([
            (0, report_service_1.getReportKPIs)(),
            (0, report_service_1.getSpendByCategory)(),
            (0, report_service_1.getTopVendors)(10),
            (0, report_service_1.getMonthlySpendTrend)(year),
        ]);
        const reportData = { kpis, spendByCategory, topVendors, monthlyTrend };
        if (format === "json") {
            res.json({ success: true, data: reportData });
            return;
        }
        // CSV format
        const csv = [
            "Category,Total Spend",
            ...spendByCategory.map((r) => `"${r.category}",${r.total}`),
        ].join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="vendorbridge-report-${new Date().toISOString().split("T")[0]}.csv"`);
        res.status(200).send(csv);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to export reports" });
    }
});
exports.default = router;
