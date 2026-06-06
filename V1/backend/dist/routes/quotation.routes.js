"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const quotation_validation_1 = require("../validations/quotation.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const activity_service_1 = require("../services/activity.service");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
function calculateItemTotal(unitPrice, quantity, taxPct) {
    const subtotal = unitPrice * quantity;
    const tax = (subtotal * taxPct) / 100;
    return subtotal + tax;
}
// GET /api/quotations - List quotations
router.get("/", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { rfqId } = req.query;
        if (req.user.role === client_1.UserRole.VENDOR) {
            const vendor = await db_1.db.vendor.findUnique({ where: { email: req.user.email } });
            if (!vendor) {
                res.json({ success: true, data: [] });
                return;
            }
            const quotations = await db_1.db.quotation.findMany({
                where: {
                    vendorId: vendor.id,
                    ...(rfqId ? { rfqId: String(rfqId) } : {}),
                },
                include: {
                    rfq: true,
                    items: true,
                },
                orderBy: { updatedAt: "desc" },
            });
            res.json({ success: true, data: quotations });
            return;
        }
        // Admin/Officer/Manager see all quotations
        const where = {};
        if (rfqId) {
            where.rfqId = String(rfqId);
        }
        const quotations = await db_1.db.quotation.findMany({
            where,
            include: {
                rfq: true,
                vendor: true,
                items: true,
            },
            orderBy: { updatedAt: "desc" },
        });
        res.json({ success: true, data: quotations });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch quotations" });
    }
});
// GET /api/quotations/:id - Quotation details
router.get("/:id", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role === client_1.UserRole.VENDOR) {
            const vendor = await db_1.db.vendor.findUnique({ where: { email: req.user.email } });
            if (!vendor) {
                res.status(403).json({ success: false, error: "Access denied" });
                return;
            }
            const quotation = await db_1.db.quotation.findFirst({
                where: { id, vendorId: vendor.id },
                include: {
                    rfq: { include: { items: true } },
                    items: true,
                },
            });
            if (!quotation) {
                res.status(404).json({ success: false, error: "Quotation not found" });
                return;
            }
            res.json({ success: true, data: quotation });
            return;
        }
        // Admin/Officer/Manager detail view
        const quotation = await db_1.db.quotation.findUnique({
            where: { id },
            include: {
                rfq: { include: { items: true } },
                vendor: true,
                items: true,
            },
        });
        if (!quotation) {
            res.status(404).json({ success: false, error: "Quotation not found" });
            return;
        }
        res.json({ success: true, data: quotation });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch quotation" });
    }
});
// POST /api/quotations/draft - Save Draft
router.post("/draft", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.VENDOR]), async (req, res) => {
    try {
        const parsed = quotation_validation_1.quotationSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: parsed.error.errors[0].message });
            return;
        }
        const vendor = await db_1.db.vendor.findUnique({ where: { email: req.user.email } });
        if (!vendor) {
            res.status(400).json({ success: false, error: "Vendor record not found for this user." });
            return;
        }
        const totalAmount = parsed.data.items.reduce((sum, item) => {
            return sum + calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage);
        }, 0);
        const quotation = await db_1.db.quotation.upsert({
            where: { rfqId_vendorId: { rfqId: parsed.data.rfqId, vendorId: vendor.id } },
            update: {
                deliveryTimeline: parsed.data.deliveryTimeline,
                notes: parsed.data.notes,
                totalAmount,
                status: "DRAFT",
                items: {
                    deleteMany: {},
                    create: parsed.data.items.map((item) => ({
                        rfqItemId: item.rfqItemId,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        taxPercentage: item.taxPercentage,
                        totalAmount: calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage),
                    })),
                },
            },
            create: {
                rfqId: parsed.data.rfqId,
                vendorId: vendor.id,
                deliveryTimeline: parsed.data.deliveryTimeline,
                notes: parsed.data.notes,
                totalAmount,
                status: "DRAFT",
                items: {
                    create: parsed.data.items.map((item) => ({
                        rfqItemId: item.rfqItemId,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        taxPercentage: item.taxPercentage,
                        totalAmount: calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage),
                    })),
                },
            },
        });
        res.json({ success: true, data: { id: quotation.id } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to save draft" });
    }
});
// POST /api/quotations/submit - Submit Quotation
router.post("/submit", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.VENDOR]), async (req, res) => {
    try {
        const parsed = quotation_validation_1.quotationSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: parsed.error.errors[0].message });
            return;
        }
        const vendor = await db_1.db.vendor.findUnique({ where: { email: req.user.email } });
        if (!vendor) {
            res.status(400).json({ success: false, error: "Vendor record not found for this user." });
            return;
        }
        const totalAmount = parsed.data.items.reduce((sum, item) => {
            return sum + calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage);
        }, 0);
        const quotation = await db_1.db.quotation.upsert({
            where: { rfqId_vendorId: { rfqId: parsed.data.rfqId, vendorId: vendor.id } },
            update: {
                deliveryTimeline: parsed.data.deliveryTimeline,
                notes: parsed.data.notes,
                totalAmount,
                status: "SUBMITTED",
                submittedAt: new Date(),
                items: {
                    deleteMany: {},
                    create: parsed.data.items.map((item) => ({
                        rfqItemId: item.rfqItemId,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        taxPercentage: item.taxPercentage,
                        totalAmount: calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage),
                    })),
                },
            },
            create: {
                rfqId: parsed.data.rfqId,
                vendorId: vendor.id,
                deliveryTimeline: parsed.data.deliveryTimeline,
                notes: parsed.data.notes,
                totalAmount,
                status: "SUBMITTED",
                submittedAt: new Date(),
                items: {
                    create: parsed.data.items.map((item) => ({
                        rfqItemId: item.rfqItemId,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        taxPercentage: item.taxPercentage,
                        totalAmount: calculateItemTotal(item.unitPrice, item.quantity, item.taxPercentage),
                    })),
                },
            },
        });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "QUOTATION_SUBMITTED",
            module: "QUOTATION",
            entityId: quotation.id,
            metadata: { rfqId: parsed.data.rfqId, totalAmount },
        });
        res.json({ success: true, data: { id: quotation.id } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to submit quotation" });
    }
});
// POST /api/quotations/:id/select - Select Quotation & trigger approval workflow
router.post("/:id/select", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.PROCUREMENT_OFFICER]), async (req, res) => {
    try {
        const { id } = req.params;
        const quotation = await db_1.db.quotation.findUnique({ where: { id } });
        if (!quotation) {
            res.status(404).json({ success: false, error: "Quotation not found." });
            return;
        }
        // Reject all other quotations for this RFQ
        await db_1.db.quotation.updateMany({
            where: { rfqId: quotation.rfqId, id: { not: id } },
            data: { status: "REJECTED" },
        });
        // Select this quotation
        await db_1.db.quotation.update({
            where: { id },
            data: { status: "SELECTED" },
        });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "QUOTATION_SELECTED",
            module: "QUOTATION",
            entityId: id,
            metadata: { rfqId: quotation.rfqId },
        });
        // Submit for Approval workflow (create Approval entry if not exists)
        const existingApproval = await db_1.db.approval.findUnique({ where: { quotationId: id } });
        if (!existingApproval) {
            await db_1.db.approval.create({
                data: {
                    quotationId: id,
                    rfqId: quotation.rfqId,
                    status: "PENDING",
                },
            });
            await (0, activity_service_1.logActivity)({
                userId: req.user.id,
                action: "APPROVAL_REQUESTED",
                module: "APPROVAL",
                entityId: id,
                metadata: { rfqId: quotation.rfqId, quotationId: id },
            });
        }
        res.json({ success: true, message: "Quotation selected and submitted for approval successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to select quotation" });
    }
});
// POST /api/quotations/:id/reject - Reject Quotation
router.post("/:id/reject", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.PROCUREMENT_OFFICER]), async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.db.quotation.update({
            where: { id },
            data: { status: "REJECTED" },
        });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "QUOTATION_REJECTED",
            module: "QUOTATION",
            entityId: id,
            metadata: {},
        });
        res.json({ success: true, message: "Quotation rejected successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to reject quotation" });
    }
});
exports.default = router;
