import { Router, Response } from "express";
import { db } from "../db";
import { authenticateJWT, requireRoles, AuthenticatedRequest } from "../middleware/auth.middleware";
import { logActivity } from "../services/activity.service";
import { generateInvoice } from "../services/invoice.service";
import { UserRole, POStatus } from "@prisma/client";

const router = Router();

// GET /api/purchase-orders - List purchase orders
router.get("/", authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === UserRole.VENDOR) {
      const vendor = await db.vendor.findUnique({ where: { email: req.user!.email } });
      if (!vendor) {
        res.json({ success: true, data: [] });
        return;
      }

      const pos = await db.purchaseOrder.findMany({
        where: { vendorId: vendor.id },
        include: {
          rfq: true,
          vendor: true,
          items: true,
        },
        orderBy: { issueDate: "desc" },
      });

      res.json({ success: true, data: pos });
      return;
    }

    // Admin/Officer/Manager see all POs
    const pos = await db.purchaseOrder.findMany({
      include: {
        rfq: true,
        vendor: true,
        items: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { issueDate: "desc" },
    });

    res.json({ success: true, data: pos });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch POs" });
  }
});

// GET /api/purchase-orders/:id - Purchase order details
router.get("/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user!.role === UserRole.VENDOR) {
      const vendor = await db.vendor.findUnique({ where: { email: req.user!.email } });
      if (!vendor) {
        res.status(403).json({ success: false, error: "Access denied" });
        return;
      }

      const po = await db.purchaseOrder.findFirst({
        where: { id, vendorId: vendor.id },
        include: {
          rfq: true,
          vendor: true,
          items: true,
        },
      });

      if (!po) {
        res.status(404).json({ success: false, error: "Purchase order not found" });
        return;
      }

      res.json({ success: true, data: po });
      return;
    }

    // Admin/Officer/Manager detail view
    const po = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        rfq: true,
        vendor: true,
        items: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!po) {
      res.status(404).json({ success: false, error: "Purchase order not found" });
      return;
    }

    res.json({ success: true, data: po });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch PO" });
  }
});

// PUT /api/purchase-orders/:id/status - Update PO Status
router.put(
  "/:id/status",
  authenticateJWT,
  requireRoles([UserRole.ADMIN, UserRole.PROCUREMENT_OFFICER]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(POStatus).includes(status)) {
        res.status(400).json({ success: false, error: "Invalid status value" });
        return;
      }

      const po = await db.purchaseOrder.update({
        where: { id },
        data: { status },
      });

      await logActivity({
        userId: req.user!.id,
        action: "PO_STATUS_UPDATED",
        module: "PURCHASE_ORDER",
        entityId: id,
        metadata: { poNumber: po.poNumber, status },
      });

      res.json({ success: true, data: po });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to update PO status" });
    }
  }
);

// POST /api/purchase-orders/:id/invoice - Generate Invoice from PO
router.post(
  "/:id/invoice",
  authenticateJWT,
  requireRoles([UserRole.ADMIN, UserRole.PROCUREMENT_OFFICER]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await generateInvoice(id, req.user!.id);
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }

      res.status(201).json({ success: true, data: result.data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to generate invoice" });
    }
  }
);

export default router;
