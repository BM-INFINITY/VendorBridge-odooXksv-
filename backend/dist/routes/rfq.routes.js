"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const rfq_validation_1 = require("../validations/rfq.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const activity_service_1 = require("../services/activity.service");
const utils_1 = require("../utils");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// GET /api/rfqs - List RFQs
router.get("/", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { status } = req.query;
        if (req.user.role === client_1.UserRole.VENDOR) {
            const vendor = await db_1.db.vendor.findUnique({ where: { email: req.user.email } });
            if (!vendor) {
                res.json({ success: true, data: [] });
                return;
            }
            const rfqs = await db_1.db.rFQ.findMany({
                where: {
                    vendors: { some: { vendorId: vendor.id } },
                    status: status ? status : { in: ["PUBLISHED", "CLOSED"] }, // Vendors cannot see DRAFT
                },
                include: {
                    items: true,
                },
                orderBy: { createdAt: "desc" },
            });
            res.json({ success: true, data: rfqs });
            return;
        }
        // Admin/Officer/Manager see all RFQs
        const where = {};
        if (status) {
            where.status = status;
        }
        const rfqs = await db_1.db.rFQ.findMany({
            where,
            include: {
                items: true,
                vendors: {
                    include: {
                        vendor: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: rfqs });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch RFQs" });
    }
});
// GET /api/rfqs/:id - RFQ details
router.get("/:id", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role === client_1.UserRole.VENDOR) {
            const vendor = await db_1.db.vendor.findUnique({ where: { email: req.user.email } });
            if (!vendor) {
                res.status(403).json({ success: false, error: "Access denied" });
                return;
            }
            const rfq = await db_1.db.rFQ.findFirst({
                where: {
                    id,
                    vendors: { some: { vendorId: vendor.id } },
                    status: { in: ["PUBLISHED", "CLOSED"] },
                },
                include: {
                    items: true,
                    quotations: {
                        where: { vendorId: vendor.id },
                        include: { items: true },
                    },
                },
            });
            if (!rfq) {
                res.status(404).json({ success: false, error: "RFQ not found or not assigned to you" });
                return;
            }
            res.json({ success: true, data: rfq });
            return;
        }
        // Admin/Officer/Manager detail view
        const rfq = await db_1.db.rFQ.findUnique({
            where: { id },
            include: {
                items: true,
                vendors: {
                    include: {
                        vendor: true,
                    },
                },
                quotations: {
                    include: {
                        vendor: true,
                        items: true,
                    },
                },
            },
        });
        if (!rfq) {
            res.status(404).json({ success: false, error: "RFQ not found" });
            return;
        }
        res.json({ success: true, data: rfq });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch RFQ" });
    }
});
// POST /api/rfqs - Create RFQ
router.post("/", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.PROCUREMENT_OFFICER]), async (req, res) => {
    try {
        const parsed = rfq_validation_1.rfqSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: parsed.error.errors[0].message });
            return;
        }
        const rfqCount = await db_1.db.rFQ.count();
        const rfqNumber = (0, utils_1.generateDocumentNumber)("RFQ", rfqCount);
        const rfq = await db_1.db.rFQ.create({
            data: {
                rfqNumber,
                title: parsed.data.title,
                description: parsed.data.description,
                category: parsed.data.category,
                deadline: parsed.data.deadline,
                status: "DRAFT",
                createdById: req.user.id,
                items: {
                    create: parsed.data.items.map((item) => ({
                        itemName: item.itemName,
                        quantity: item.quantity,
                        unit: item.unit,
                    })),
                },
                vendors: {
                    create: parsed.data.vendorIds.map((vendorId) => ({ vendorId })),
                },
            },
            include: {
                items: true,
            },
        });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "RFQ_CREATED",
            module: "RFQ",
            entityId: rfq.id,
            metadata: { rfqNumber: rfq.rfqNumber, title: rfq.title },
        });
        res.status(201).json({ success: true, data: rfq });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to create RFQ" });
    }
});
// POST /api/rfqs/:id/publish - Publish RFQ
router.post("/:id/publish", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.PROCUREMENT_OFFICER]), async (req, res) => {
    try {
        const { id } = req.params;
        const rfq = await db_1.db.rFQ.update({
            where: { id },
            data: { status: "PUBLISHED" },
        });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "RFQ_PUBLISHED",
            module: "RFQ",
            entityId: rfq.id,
            metadata: { rfqNumber: rfq.rfqNumber },
        });
        res.json({ success: true, data: rfq });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to publish RFQ" });
    }
});
// POST /api/rfqs/:id/close - Close RFQ
router.post("/:id/close", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.PROCUREMENT_OFFICER]), async (req, res) => {
    try {
        const { id } = req.params;
        const rfq = await db_1.db.rFQ.update({
            where: { id },
            data: { status: "CLOSED" },
        });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "RFQ_CLOSED",
            module: "RFQ",
            entityId: rfq.id,
            metadata: { rfqNumber: rfq.rfqNumber },
        });
        res.json({ success: true, data: rfq });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to close RFQ" });
    }
});
// PUT /api/rfqs/:id - Update Draft RFQ
router.put("/:id", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.PROCUREMENT_OFFICER]), async (req, res) => {
    try {
        const { id } = req.params;
        const parsed = rfq_validation_1.rfqSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: parsed.error.errors[0].message });
            return;
        }
        const existing = await db_1.db.rFQ.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, error: "RFQ not found" });
            return;
        }
        if (existing.status !== "DRAFT") {
            res.status(400).json({ success: false, error: "Only draft RFQs can be edited" });
            return;
        }
        // Update in a transaction to replace items and vendors cleanly
        const updatedRfq = await db_1.db.$transaction(async (tx) => {
            await tx.rFQItem.deleteMany({ where: { rfqId: id } });
            await tx.rFQVendor.deleteMany({ where: { rfqId: id } });
            return await tx.rFQ.update({
                where: { id },
                data: {
                    title: parsed.data.title,
                    description: parsed.data.description,
                    category: parsed.data.category,
                    deadline: parsed.data.deadline,
                    items: {
                        create: parsed.data.items.map((item) => ({
                            itemName: item.itemName,
                            quantity: item.quantity,
                            unit: item.unit,
                        })),
                    },
                    vendors: {
                        create: parsed.data.vendorIds.map((vendorId) => ({ vendorId })),
                    },
                },
                include: {
                    items: true,
                },
            });
        });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "RFQ_UPDATED",
            module: "RFQ",
            entityId: id,
            metadata: { rfqNumber: existing.rfqNumber },
        });
        res.json({ success: true, data: updatedRfq });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to update RFQ" });
    }
});
exports.default = router;
