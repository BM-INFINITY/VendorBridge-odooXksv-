"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const vendor_validation_1 = require("../validations/vendor.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const activity_service_1 = require("../services/activity.service");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// GET /api/vendors - List all vendors
router.get("/", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { status, search } = req.query;
        const where = {};
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
        const vendors = await db_1.db.vendor.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: vendors });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch vendors" });
    }
});
// GET /api/vendors/:id - Vendor details
router.get("/:id", auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const vendor = await db_1.db.vendor.findUnique({
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch vendor" });
    }
});
// POST /api/vendors - Create vendor
router.post("/", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.PROCUREMENT_OFFICER]), async (req, res) => {
    try {
        const parsed = vendor_validation_1.vendorSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: parsed.error.errors[0].message });
            return;
        }
        const existing = await db_1.db.vendor.findUnique({ where: { email: parsed.data.email } });
        if (existing) {
            res.status(400).json({ success: false, error: "A vendor with this email already exists." });
            return;
        }
        const vendor = await db_1.db.vendor.create({
            data: {
                ...parsed.data,
                createdById: req.user.id,
            },
        });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "VENDOR_CREATED",
            module: "VENDOR",
            entityId: vendor.id,
            metadata: { vendorName: vendor.vendorName, email: vendor.email },
        });
        res.status(201).json({ success: true, data: vendor });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to create vendor" });
    }
});
// PUT /api/vendors/:id - Update vendor
router.put("/:id", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN, client_1.UserRole.PROCUREMENT_OFFICER]), async (req, res) => {
    try {
        const { id } = req.params;
        const parsed = vendor_validation_1.vendorSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: parsed.error.errors[0].message });
            return;
        }
        const existing = await db_1.db.vendor.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, error: "Vendor not found" });
            return;
        }
        const vendor = await db_1.db.vendor.update({
            where: { id },
            data: parsed.data,
        });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "VENDOR_UPDATED",
            module: "VENDOR",
            entityId: vendor.id,
            metadata: { vendorName: vendor.vendorName },
        });
        res.json({ success: true, data: vendor });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to update vendor" });
    }
});
// DELETE /api/vendors/:id - Delete vendor
router.delete("/:id", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await db_1.db.vendor.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, error: "Vendor not found" });
            return;
        }
        await db_1.db.vendor.delete({ where: { id } });
        await (0, activity_service_1.logActivity)({
            userId: req.user.id,
            action: "VENDOR_DELETED",
            module: "VENDOR",
            entityId: id,
            metadata: { vendorName: existing.vendorName },
        });
        res.json({ success: true, message: "Vendor deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to delete vendor" });
    }
});
exports.default = router;
