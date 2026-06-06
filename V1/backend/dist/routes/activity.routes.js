"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const activity_service_1 = require("../services/activity.service");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// GET /api/activity-logs - List activity logs (ADMIN only)
router.get("/", auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRoles)([client_1.UserRole.ADMIN]), async (req, res) => {
    try {
        const moduleFilter = req.query.module ? String(req.query.module) : undefined;
        const page = req.query.page ? parseInt(String(req.query.page)) : 1;
        const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 20;
        if (moduleFilter && !Object.values(client_1.ActivityModule).includes(moduleFilter)) {
            res.status(400).json({ success: false, error: "Invalid module filter value" });
            return;
        }
        const result = await (0, activity_service_1.getActivityLogs)(moduleFilter, page, pageSize);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Failed to fetch activity logs" });
    }
});
exports.default = router;
