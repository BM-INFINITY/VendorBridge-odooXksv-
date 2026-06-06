import { Router, Response } from "express";
import { db } from "../db";
import { authenticateJWT, requireRoles, AuthenticatedRequest } from "../middleware/auth.middleware";
import { logActivity } from "../services/activity.service";
import { generatePurchaseOrder } from "../services/purchase-order.service";
import { UserRole } from "@prisma/client";

const router = Router();

// GET /api/approvals - List approvals
router.get("/", authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === UserRole.VENDOR) {
      const vendor = await db.vendor.findUnique({ where: { email: req.user!.email } });
      if (!vendor) {
        res.json({ success: true, data: [] });
        return;
      }

      const approvals = await db.approval.findMany({
        where: {
          quotation: { vendorId: vendor.id },
        },
        include: {
          quotation: {
            include: { vendor: true },
          },
          rfq: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ success: true, data: approvals });
      return;
    }

    // Admin/Officer/Manager see all approvals
    const approvals = await db.approval.findMany({
      include: {
        quotation: {
          include: { vendor: true },
        },
        rfq: true,
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: approvals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch approvals" });
  }
});

// GET /api/approvals/:id - Approval details
router.get("/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user!.role === UserRole.VENDOR) {
      const vendor = await db.vendor.findUnique({ where: { email: req.user!.email } });
      if (!vendor) {
        res.status(403).json({ success: false, error: "Access denied" });
        return;
      }

      const approval = await db.approval.findFirst({
        where: {
          id,
          quotation: { vendorId: vendor.id },
        },
        include: {
          quotation: {
            include: { vendor: true, items: true },
          },
          rfq: { include: { items: true } },
        },
      });

      if (!approval) {
        res.status(404).json({ success: false, error: "Approval request not found" });
        return;
      }

      res.json({ success: true, data: approval });
      return;
    }

    // Admin/Officer/Manager detail view
    const approval = await db.approval.findUnique({
      where: { id },
      include: {
        quotation: {
          include: { vendor: true, items: true },
        },
        rfq: { include: { items: true } },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!approval) {
      res.status(404).json({ success: false, error: "Approval request not found" });
      return;
    }

    res.json({ success: true, data: approval });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch approval" });
  }
});

// POST /api/approvals/:id/approve - Approve Request
router.post(
  "/:id/approve",
  authenticateJWT,
  requireRoles([UserRole.ADMIN, UserRole.MANAGER]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      const approval = await db.approval.update({
        where: { id },
        data: {
          status: "APPROVED",
          remarks: remarks ?? null,
          reviewedById: req.user!.id,
          reviewedAt: new Date(),
        },
      });

      await logActivity({
        userId: req.user!.id,
        action: "APPROVAL_GRANTED",
        module: "APPROVAL",
        entityId: id,
        metadata: { remarks, rfqId: approval.rfqId },
      });

      // Automatically generate Purchase Order
      const poResult = await generatePurchaseOrder(id, req.user!.id);
      if (!poResult.success) {
        res.status(400).json({ success: false, error: poResult.error });
        return;
      }

      res.json({ success: true, message: "Request approved and Purchase Order generated successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to approve request" });
    }
  }
);

// POST /api/approvals/:id/reject - Reject Request
router.post(
  "/:id/reject",
  authenticateJWT,
  requireRoles([UserRole.ADMIN, UserRole.MANAGER]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      await db.approval.update({
        where: { id },
        data: {
          status: "REJECTED",
          remarks: remarks ?? null,
          reviewedById: req.user!.id,
          reviewedAt: new Date(),
        },
      });

      await logActivity({
        userId: req.user!.id,
        action: "APPROVAL_REJECTED",
        module: "APPROVAL",
        entityId: id,
        metadata: { remarks },
      });

      res.json({ success: true, message: "Request rejected successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to reject request" });
    }
  }
);

export default router;
