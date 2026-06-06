"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approvalActionSchema = void 0;
const zod_1 = require("zod");
exports.approvalActionSchema = zod_1.z.object({
    approvalId: zod_1.z.string().min(1),
    remarks: zod_1.z.string().optional(),
});
