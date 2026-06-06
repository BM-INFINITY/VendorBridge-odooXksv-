import { Router, Response } from "express";
import { db } from "../db";
import { authenticateJWT, requireRoles, AuthenticatedRequest } from "../middleware/auth.middleware";
import { logActivity } from "../services/activity.service";
import { generatePurchaseOrder } from "../services/purchase-order.service";
import { generateInvoice } from "../services/invoice.service";
import { generateInvoicePDF } from "../services/pdf.service";
import { sendInvoiceEmail } from "../services/email.service";
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
// PRD §3: Manager/Approver only — Admin cannot participate in approval decisions by default.
router.post(
  "/:id/approve",
  authenticateJWT,
  requireRoles([UserRole.MANAGER]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      // Workflow guard: only PENDING approvals can be actioned
      const existing = await db.approval.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, error: "Approval request not found." });
        return;
      }
      if (existing.status !== "PENDING") {
        res.status(400).json({
          success: false,
          error: `Cannot approve: request is already ${existing.status.toLowerCase()}.`,
        });
        return;
      }

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

      const poId = poResult.data!.id;

      // Automatically generate Invoice from PO
      const invoiceResult = await generateInvoice(poId, req.user!.id);
      if (!invoiceResult.success) {
        // Non-fatal: PO was created, invoice failed — still return success but warn
        console.error("[APPROVAL] Invoice generation failed:", invoiceResult.error);
        res.json({ success: true, message: "Approved and Purchase Order generated. Invoice generation failed.", poId });
        return;
      }

      const invoiceId = invoiceResult.data!.id;

      // Load invoice + vendor for email
      const invoiceForEmail = await db.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          vendor: true,
          purchaseOrder: { include: { rfq: true } },
        },
      });

      let emailedTo: string | null = null;
      let invoiceNumber: string | null = null;
      let poNumber: string | null = null;

      if (invoiceForEmail) {
        invoiceNumber = invoiceForEmail.invoiceNumber;
        poNumber = invoiceForEmail.purchaseOrder.poNumber;
        emailedTo = invoiceForEmail.vendor.email;

        try {
          const pdfBuffer = await generateInvoicePDF({
            invoiceNumber: invoiceForEmail.invoiceNumber,
            issuedAt: invoiceForEmail.issuedAt,
            vendor: invoiceForEmail.vendor,
            purchaseOrder: invoiceForEmail.purchaseOrder,
            subtotal: Number(invoiceForEmail.subtotal),
            taxAmount: Number(invoiceForEmail.taxAmount),
            grandTotal: Number(invoiceForEmail.grandTotal),
          });

          await sendInvoiceEmail({
            to: emailedTo,
            invoiceNumber: invoiceForEmail.invoiceNumber,
            vendorName: invoiceForEmail.vendor.vendorName,
            grandTotal: Number(invoiceForEmail.grandTotal),
            pdfBuffer,
          });

          // Mark invoice as SENT
          await db.invoice.update({
            where: { id: invoiceId },
            data: { status: "SENT" },
          });

          await logActivity({
            userId: req.user!.id,
            action: "INVOICE_STATUS_UPDATED",
            module: "INVOICE",
            entityId: invoiceId,
            metadata: { status: "SENT", emailedTo },
          });
        } catch (emailErr: any) {
          // Email failure is non-fatal
          console.error("[APPROVAL] Invoice email failed:", emailErr.message);
          emailedTo = null;
        }
      }

      res.json({
        success: true,
        message: "Request approved, Purchase Order and Invoice generated.",
        poId,
        invoiceId,
        invoiceNumber,
        poNumber,
        emailedTo,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to approve request" });
    }
  }
);

// POST /api/approvals/:id/reject - Reject Request
// PRD §3: Manager/Approver only — Admin cannot participate in approval decisions by default.
router.post(
  "/:id/reject",
  authenticateJWT,
  requireRoles([UserRole.MANAGER]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      // Workflow guard: only PENDING approvals can be actioned
      const existing = await db.approval.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, error: "Approval request not found." });
        return;
      }
      if (existing.status !== "PENDING") {
        res.status(400).json({
          success: false,
          error: `Cannot reject: request is already ${existing.status.toLowerCase()}.`,
        });
        return;
      }

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
