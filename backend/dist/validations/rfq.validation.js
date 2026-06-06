"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rfqSchema = exports.rfqItemSchema = void 0;
const zod_1 = require("zod");
exports.rfqItemSchema = zod_1.z.object({
    itemName: zod_1.z.string().min(1, "Item name is required"),
    quantity: zod_1.z.coerce.number().positive("Quantity must be positive"),
    unit: zod_1.z.string().optional(),
});
exports.rfqSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "RFQ title is required").max(200),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    deadline: zod_1.z.coerce.date().optional(),
    vendorIds: zod_1.z.array(zod_1.z.string()).min(1, "At least one vendor must be assigned"),
    items: zod_1.z.array(exports.rfqItemSchema).min(1, "At least one item is required"),
});
