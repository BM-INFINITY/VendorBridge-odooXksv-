"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationSchema = exports.quotationItemSchema = void 0;
const zod_1 = require("zod");
exports.quotationItemSchema = zod_1.z.object({
    rfqItemId: zod_1.z.string().min(1),
    unitPrice: zod_1.z.coerce.number().nonnegative("Unit price must be non-negative"),
    quantity: zod_1.z.coerce.number().positive("Quantity must be positive"),
    taxPercentage: zod_1.z.coerce.number().min(0).max(100).default(0),
});
exports.quotationSchema = zod_1.z.object({
    rfqId: zod_1.z.string().min(1),
    deliveryTimeline: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    items: zod_1.z.array(exports.quotationItemSchema).min(1, "At least one item is required"),
});
