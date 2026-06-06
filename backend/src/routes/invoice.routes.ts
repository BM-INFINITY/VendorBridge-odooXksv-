import { Router, Response } from "express";
import { db } from "../db";
import { authenticateJWT, requireRoles, AuthenticatedRequest } from "../middleware/auth.middleware";
import { logActivity } from "../services/activity.service";
import { generateInvoicePDF } from "../services/pdf.service";
import { sendInvoiceEmail } from "../services/email.service";
import { UserRole, InvoiceStatus } from "@prisma/client";

const router = Router();

// GET /api/invoices - List invoices
router.get("/", authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === UserRole.VENDOR) {
      const vendor = await db.vendor.findUnique({ where: { email: req.user!.email } });
      if (!vendor) {
        res.json({ success: true, data: [] });
        return;
      }

      const invoices = await db.invoice.findMany({
        where: { vendorId: vendor.id },
        include: {
          purchaseOrder: { include: { rfq: true } },
          vendor: true,
        },
        orderBy: { issuedAt: "desc" },
      });

      res.json({ success: true, data: invoices });
      return;
    }

    // Admin/Officer/Manager see all invoices
    const invoices = await db.invoice.findMany({
      include: {
        purchaseOrder: { include: { rfq: true } },
        vendor: true,
      },
      orderBy: { issuedAt: "desc" },
    });

    res.json({ success: true, data: invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch invoices" });
  }
});

// GET /api/invoices/:id - Invoice details
router.get("/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user!.role === UserRole.VENDOR) {
      const vendor = await db.vendor.findUnique({ where: { email: req.user!.email } });
      if (!vendor) {
        res.status(403).json({ success: false, error: "Access denied" });
        return;
      }

      const invoice = await db.invoice.findFirst({
        where: { id, vendorId: vendor.id },
        include: {
          purchaseOrder: { include: { rfq: true, items: true } },
          vendor: true,
        },
      });

      if (!invoice) {
        res.status(404).json({ success: false, error: "Invoice not found" });
        return;
      }

      res.json({ success: true, data: invoice });
      return;
    }

    // Admin/Officer/Manager detail view
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        purchaseOrder: { include: { rfq: true, items: true } },
        vendor: true,
      },
    });

    if (!invoice) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch invoice" });
  }
});

// PUT /api/invoices/:id/status - Update invoice status
router.put(
  "/:id/status",
  authenticateJWT,
  requireRoles([UserRole.ADMIN, UserRole.PROCUREMENT_OFFICER, UserRole.MANAGER]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(InvoiceStatus).includes(status)) {
        res.status(400).json({ success: false, error: "Invalid status value" });
        return;
      }

      const invoice = await db.invoice.update({
        where: { id },
        data: { status },
      });

      await logActivity({
        userId: req.user!.id,
        action: "INVOICE_STATUS_UPDATED",
        module: "INVOICE",
        entityId: id,
        metadata: { status },
      });

      res.json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to update invoice status" });
    }
  }
);

// GET /api/invoices/:id/pdf - Stream PDF
router.get("/:id/pdf", authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        purchaseOrder: { include: { rfq: true } },
      },
    });

    if (!invoice) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    // Authorization check for VENDORS
    if (req.user!.role === UserRole.VENDOR) {
      const vendor = await db.vendor.findUnique({ where: { email: req.user!.email } });
      if (!vendor || invoice.vendorId !== vendor.id) {
        res.status(403).json({ success: false, error: "Access denied" });
        return;
      }
    }

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      vendor: invoice.vendor,
      purchaseOrder: invoice.purchaseOrder,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      grandTotal: Number(invoice.grandTotal),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length.toString());
    res.end(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to generate PDF" });
  }
});

// POST /api/invoices/:id/email - Send email with attachment
// PRD §3: Only Officer/Admin can distribute invoices.
router.post("/:id/email", authenticateJWT, requireRoles([UserRole.ADMIN, UserRole.PROCUREMENT_OFFICER]), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        purchaseOrder: { include: { rfq: true } },
      },
    });

    if (!invoice) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }

    // Authorization check for VENDORS
    if (req.user!.role === UserRole.VENDOR) {
      const vendor = await db.vendor.findUnique({ where: { email: req.user!.email } });
      if (!vendor || invoice.vendorId !== vendor.id) {
        res.status(403).json({ success: false, error: "Access denied" });
        return;
      }
    }

    const recipientEmail = email ?? invoice.vendor.email;

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      vendor: invoice.vendor,
      purchaseOrder: invoice.purchaseOrder,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      grandTotal: Number(invoice.grandTotal),
    });

    // Send email
    await sendInvoiceEmail({
      to: recipientEmail,
      invoiceNumber: invoice.invoiceNumber,
      vendorName: invoice.vendor.vendorName,
      grandTotal: Number(invoice.grandTotal),
      pdfBuffer,
    });

    // Update invoice status to SENT
    await db.invoice.update({
      where: { id },
      data: { status: "SENT" },
    });

    await logActivity({
      userId: req.user!.id,
      action: "INVOICE_STATUS_UPDATED",
      module: "INVOICE",
      entityId: id,
      metadata: { status: "SENT", emailedTo: recipientEmail },
    });

    res.json({ success: true, sentTo: recipientEmail });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to send invoice email" });
  }
});

export default router;
