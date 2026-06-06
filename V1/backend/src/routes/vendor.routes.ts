import { Router, Response } from "express";
import { db } from "../db";
import { vendorSchema } from "../validations/vendor.validation";
import { authenticateJWT, requireRoles, AuthenticatedRequest } from "../middleware/auth.middleware";
import { logActivity } from "../services/activity.service";
import { UserRole } from "@prisma/client";

const router = Router();

// GET /api/vendors - List all vendors
router.get("/", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, search } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { vendorName: { contains: String(search), mode: "insensitive" } },
        { companyName: { contains: String(search), mode: "insensitive" } },
        { contactPerson: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const vendors = await db.vendor.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: vendors });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch vendors" });
  }
});

// GET /api/vendors/:id - Vendor details
router.get("/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const vendor = await db.vendor.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!vendor) {
      res.status(404).json({ success: false, error: "Vendor not found" });
      return;
    }

    res.json({ success: true, data: vendor });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch vendor" });
  }
});

// POST /api/vendors - Create vendor
router.post(
  "/",
  authenticateJWT,
  requireRoles([UserRole.ADMIN, UserRole.PROCUREMENT_OFFICER]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parsed = vendorSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.errors[0].message });
        return;
      }

      const existing = await db.vendor.findUnique({ where: { email: parsed.data.email } });
      if (existing) {
        res.status(400).json({ success: false, error: "A vendor with this email already exists." });
        return;
      }

      const vendor = await db.vendor.create({
        data: {
          ...parsed.data,
          createdById: req.user!.id,
        },
      });

      await logActivity({
        userId: req.user!.id,
        action: "VENDOR_CREATED",
        module: "VENDOR",
        entityId: vendor.id,
        metadata: { vendorName: vendor.vendorName, email: vendor.email },
      });

      res.status(201).json({ success: true, data: vendor });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to create vendor" });
    }
  }
);

// PUT /api/vendors/:id - Update vendor
router.put(
  "/:id",
  authenticateJWT,
  requireRoles([UserRole.ADMIN, UserRole.PROCUREMENT_OFFICER]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const parsed = vendorSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.errors[0].message });
        return;
      }

      const existing = await db.vendor.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, error: "Vendor not found" });
        return;
      }

      const vendor = await db.vendor.update({
        where: { id },
        data: parsed.data,
      });

      await logActivity({
        userId: req.user!.id,
        action: "VENDOR_UPDATED",
        module: "VENDOR",
        entityId: vendor.id,
        metadata: { vendorName: vendor.vendorName },
      });

      res.json({ success: true, data: vendor });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to update vendor" });
    }
  }
);

// DELETE /api/vendors/:id - Delete vendor
router.delete(
  "/:id",
  authenticateJWT,
  requireRoles([UserRole.ADMIN]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const existing = await db.vendor.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, error: "Vendor not found" });
        return;
      }

      await db.vendor.delete({ where: { id } });

      await logActivity({
        userId: req.user!.id,
        action: "VENDOR_DELETED",
        module: "VENDOR",
        entityId: id,
        metadata: { vendorName: existing.vendorName },
      });

      res.json({ success: true, message: "Vendor deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to delete vendor" });
    }
  }
);

export default router;
