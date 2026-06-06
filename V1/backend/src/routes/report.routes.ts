import { Router, Response } from "express";
import { authenticateJWT, requireRoles, AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  getDashboardKPIs,
  getReportKPIs,
  getSpendByCategory,
  getTopVendors,
  getMonthlySpendTrend,
} from "../services/report.service";
import { UserRole } from "@prisma/client";

const router = Router();

// GET /api/reports/dashboard - Dashboard KPIs
router.get("/dashboard", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const kpis = await getDashboardKPIs();
    res.json({ success: true, data: kpis });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch dashboard KPIs" });
  }
});

// GET /api/reports/kpis - Report Page KPIs
router.get("/kpis", authenticateJWT, requireRoles([UserRole.ADMIN, UserRole.MANAGER]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const kpis = await getReportKPIs();
    res.json({ success: true, data: kpis });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch report KPIs" });
  }
});

// GET /api/reports/spend-by-category - Category Spend chart data
router.get("/spend-by-category", authenticateJWT, requireRoles([UserRole.ADMIN, UserRole.MANAGER]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await getSpendByCategory();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch category spend" });
  }
});

// GET /api/reports/top-vendors - Top Vendors chart data
router.get("/top-vendors", authenticateJWT, requireRoles([UserRole.ADMIN, UserRole.MANAGER]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
    const data = await getTopVendors(limit);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch top vendors" });
  }
});

// GET /api/reports/spend-trend - Monthly spend trend
router.get("/spend-trend", authenticateJWT, requireRoles([UserRole.ADMIN, UserRole.MANAGER]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const year = req.query.year ? parseInt(String(req.query.year)) : undefined;
    const data = await getMonthlySpendTrend(year);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch spend trend" });
  }
});

// GET /api/reports/export - Export reports as JSON or CSV
router.get(
  "/export",
  authenticateJWT,
  requireRoles([UserRole.ADMIN, UserRole.MANAGER]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const format = req.query.format ?? "json";
      const year = req.query.year ? parseInt(String(req.query.year)) : undefined;

      const [kpis, spendByCategory, topVendors, monthlyTrend] = await Promise.all([
        getReportKPIs(),
        getSpendByCategory(),
        getTopVendors(10),
        getMonthlySpendTrend(year),
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
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="vendorbridge-report-${new Date().toISOString().split("T")[0]}.csv"`
      );
      res.status(200).send(csv);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to export reports" });
    }
  }
);

export default router;
