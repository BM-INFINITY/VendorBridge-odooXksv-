"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_middleware_1 = require("../middleware/auth.middleware");
const activity_service_1 = require("../services/activity.service");
const purchase_order_service_1 = require("../services/purchase-order.service");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// GET /api/approvals - List approvals
router.get("/", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        if (req.user.role === client_1.UserRole.VENDOR) {
            const vendor = await db_1.db.vendor.findUnique({ where: { email: req.user.email } });
            if (!vendor) {
                res.json({ success: true, data: [] });
                return;
            }
            const approvals = await db_1.db.approval.findMany({
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
        const approvals = await db_1.db.approval.findMany({
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch approvals" });
    }
});
// GET /api/approvals/:id - Approval details
router.get("/:id", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role === client_1.UserRole.VENDOR) {
            const vendor = await db_1.db.vendor.findUnique({ where: { email: req.user.email } });
            if (!vendor) {
                res.status(403).json({ success: false, error: "Access denied" });
                return;
            }
            const approval = await db_1.db.approval.findFirst({
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
        const approval = await db_1.db.approval.findUnique({
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch approval" });
    }
});
// POST /api/approvals/:id/approve - Approve Request
router.post("/:id/approve", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.MANAGER]), async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;
        const approval = await db_1.db.approval.update({
            where: { id },
            data: {
                status: "APPROVED",
                remarks: remarks ?? null,
                reviewedById: req.user.id,
                reviewedAt: new Date(),
            },
        });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "APPROVAL_GRANTED",
            module: "APPROVAL",
            entityId: id,
            metadata: { remarks, rfqId: approval.rfqId },
        });
        // Automatically generate Purchase Order
        const poResult = await (0, purchase_order_service_1.generatePurchaseOrder)(id, req.user.id);
        if (!poResult.success) {
            res.status(400).json({ success: false, error: poResult.error });
            return;
        }
        res.json({ success: true, message: "Request approved and Purchase Order generated successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to approve request" });
    }
});
// POST /api/approvals/:id/reject - Reject Request
router.post("/:id/reject", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.MANAGER]), async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;
        await db_1.db.approval.update({
            where: { id },
            data: {
                status: "REJECTED",
                remarks: remarks ?? null,
                reviewedById: req.user.id,
                reviewedAt: new Date(),
            },
        });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "APPROVAL_REJECTED",
            module: "APPROVAL",
            entityId: id,
            metadata: { remarks },
        });
        res.json({ success: true, message: "Request rejected successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to reject request" });
    }
});
exports.default = router;
