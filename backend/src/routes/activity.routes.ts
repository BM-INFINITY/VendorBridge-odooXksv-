import { Router, Response } from "express";
import { authenticateJWT, requireRoles, AuthenticatedRequest } from "../middleware/auth.middleware";
import { getActivityLogs } from "../services/activity.service";
import { UserRole, ActivityModule } from "@prisma/client";

const router = Router();

// GET /api/activity-logs - List activity logs (ADMIN only)
router.get(
  "/",
  authenticateJWT,
  requireRoles([UserRole.ADMIN]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const moduleFilter = req.query.module ? (String(req.query.module) as ActivityModule) : undefined;
      const page = req.query.page ? parseInt(String(req.query.page)) : 1;
      const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 20;

      if (moduleFilter && !Object.values(ActivityModule).includes(moduleFilter)) {
        res.status(400).json({ success: false, error: "Invalid module filter value" });
        return;
      }

      const result = await getActivityLogs(moduleFilter, page, pageSize);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch activity logs" });
    }
  }
);

export default router;
