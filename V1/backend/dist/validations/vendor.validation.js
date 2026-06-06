"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorSchema = void 0;
const zod_1 = require("zod");
exports.vendorSchema = zod_1.z.object({
    vendorName: zod_1.z.string().min(1, "Vendor name is required").max(100),
    companyName: zod_1.z.string().min(1, "Company name is required").max(150),
    contactPerson: zod_1.z.string().min(1, "Contact person is required").max(100),
    email: zod_1.z.string().email("Please enter a valid email address"),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});
