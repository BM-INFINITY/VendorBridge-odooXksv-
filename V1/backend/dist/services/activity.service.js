"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
exports.getActivityLogs = getActivityLogs;
const db_1 = require("../db");
async function logActivity(input) {
    try {
        await db_1.db.activityLog.create({
            data: {
                userId: input.userId,
                action: input.action,
                module: input.module,
                entityId: input.entityId,
                metadata: input.metadata ?? {},
            },
        });
    }
    catch (error) {
        // Activity logging should never break the main flow
        console.error("[logActivity] Failed to log activity:", error);
    }
}
async function getActivityLogs(module, page = 1, pageSize = 20) {
    const where = module ? { module } : {};
    const [logs, total] = await Promise.all([
        db_1.db.activityLog.findMany({
            where,
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true, role: true },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        db_1.db.activityLog.count({ where }),
    ]);
    return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
