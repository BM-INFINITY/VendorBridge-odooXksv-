"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_middleware_1 = require("../middleware/auth.middleware");
const activity_service_1 = require("../services/activity.service");
const invoice_service_1 = require("../services/invoice.service");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// GET /api/purchase-orders - List purchase orders
router.get("/", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        if (req.user.role === client_1.UserRole.VENDOR) {
            const vendor = await db_1.db.vendor.findUnique({ where: { email: req.user.email } });
            if (!vendor) {
                res.json({ success: true, data: [] });
                return;
            }
            const pos = await db_1.db.purchaseOrder.findMany({
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
        const pos = await db_1.db.purchaseOrder.findMany({
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch POs" });
    }
});
// GET /api/purchase-orders/:id - Purchase order details
router.get("/:id", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role === client_1.UserRole.VENDOR) {
            const vendor = await db_1.db.vendor.findUnique({ where: { email: req.user.email } });
            if (!vendor) {
                res.status(403).json({ success: false, error: "Access denied" });
                return;
            }
            const po = await db_1.db.purchaseOrder.findFirst({
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
        const po = await db_1.db.purchaseOrder.findUnique({
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch PO" });
    }
});
// PUT /api/purchase-orders/:id/status - Update PO Status
router.put("/:id/status", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.PROCUREMENT_OFFICER]), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!Object.values(client_1.POStatus).includes(status)) {
            res.status(400).json({ success: false, error: "Invalid status value" });
            return;
        }
        const po = await db_1.db.purchaseOrder.update({
            where: { id },
            data: { status },
        });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "PO_STATUS_UPDATED",
            module: "PURCHASE_ORDER",
            entityId: id,
            metadata: { poNumber: po.poNumber, status },
        });
        res.json({ success: true, data: po });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to update PO status" });
    }
});
// POST /api/purchase-orders/:id/invoice - Generate Invoice from PO
router.post("/:id/invoice", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.PROCUREMENT_OFFICER]), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await (0, invoice_service_1.generateInvoice)(id, req.user.id);
        if (!result.success) {
            res.status(400).json({ success: false, error: result.error });
            return;
        }
        res.status(201).json({ success: true, data: result.data });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to generate invoice" });
    }
});
exports.default = router;
