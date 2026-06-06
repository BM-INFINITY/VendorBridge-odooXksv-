"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_middleware_1 = require("../middleware/auth.middleware");
const activity_service_1 = require("../services/activity.service");
const pdf_service_1 = require("../services/pdf.service");
const email_service_1 = require("../services/email.service");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// GET /api/invoices - List invoices
router.get("/", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        if (req.user.role === client_1.UserRole.VENDOR) {
            const vendor = await db_1.db.vendor.findUnique({ where: { email: req.user.email } });
            if (!vendor) {
                res.json({ success: true, data: [] });
                return;
            }
            const invoices = await db_1.db.invoice.findMany({
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
        const invoices = await db_1.db.invoice.findMany({
            include: {
                purchaseOrder: { include: { rfq: true } },
                vendor: true,
            },
            orderBy: { issuedAt: "desc" },
        });
        res.json({ success: true, data: invoices });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch invoices" });
    }
});
// GET /api/invoices/:id - Invoice details
router.get("/:id", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role === client_1.UserRole.VENDOR) {
            const vendor = await db_1.db.vendor.findUnique({ where: { email: req.user.email } });
            if (!vendor) {
                res.status(403).json({ success: false, error: "Access denied" });
                return;
            }
            const invoice = await db_1.db.invoice.findFirst({
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
        const invoice = await db_1.db.invoice.findUnique({
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch invoice" });
    }
});
// PUT /api/invoices/:id/status - Update invoice status
router.put("/:id/status", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.PROCUREMENT_OFFICER, client_1.UserRole.MANAGER]), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!Object.values(client_1.InvoiceStatus).includes(status)) {
            res.status(400).json({ success: false, error: "Invalid status value" });
            return;
        }
        const invoice = await db_1.db.invoice.update({
            where: { id },
            data: { status },
        });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "INVOICE_STATUS_UPDATED",
            module: "INVOICE",
            entityId: id,
            metadata: { status },
        });
        res.json({ success: true, data: invoice });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to update invoice status" });
    }
});
// GET /api/invoices/:id/pdf - Stream PDF
router.get("/:id/pdf", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await db_1.db.invoice.findUnique({
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
        if (req.user.role === client_1.UserRole.VENDOR) {
            const vendor = await db_1.db.vendor.findUnique({ where: { email: req.user.email } });
            if (!vendor || invoice.vendorId !== vendor.id) {
                res.status(403).json({ success: false, error: "Access denied" });
                return;
            }
        }
        const pdfBuffer = await (0, pdf_service_1.generateInvoicePDF)({
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to generate PDF" });
    }
});
// POST /api/invoices/:id/email - Send email with attachment
router.post("/:id/email", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;
        const invoice = await db_1.db.invoice.findUnique({
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
        if (req.user.role === client_1.UserRole.VENDOR) {
            const vendor = await db_1.db.vendor.findUnique({ where: { email: req.user.email } });
            if (!vendor || invoice.vendorId !== vendor.id) {
                res.status(403).json({ success: false, error: "Access denied" });
                return;
            }
        }
        const recipientEmail = email ?? invoice.vendor.email;
        // Generate PDF
        const pdfBuffer = await (0, pdf_service_1.generateInvoicePDF)({
            invoiceNumber: invoice.invoiceNumber,
            issuedAt: invoice.issuedAt,
            vendor: invoice.vendor,
            purchaseOrder: invoice.purchaseOrder,
            subtotal: Number(invoice.subtotal),
            taxAmount: Number(invoice.taxAmount),
            grandTotal: Number(invoice.grandTotal),
        });
        // Send email
        await (0, email_service_1.sendInvoiceEmail)({
            to: recipientEmail,
            invoiceNumber: invoice.invoiceNumber,
            vendorName: invoice.vendor.vendorName,
            grandTotal: Number(invoice.grandTotal),
            pdfBuffer,
        });
        // Update invoice status to SENT
        await db_1.db.invoice.update({
            where: { id },
            data: { status: "SENT" },
        });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "INVOICE_STATUS_UPDATED",
            module: "INVOICE",
            entityId: id,
            metadata: { status: "SENT", emailedTo: recipientEmail },
        });
        res.json({ success: true, sentTo: recipientEmail });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to send invoice email" });
    }
});
exports.default = router;
