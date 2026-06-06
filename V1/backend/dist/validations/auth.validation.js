"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// -----------------------------------------------------------------------------
// Auth Validation Schemas (Zod)
// Used by Server Actions for runtime type safety.
// -----------------------------------------------------------------------------
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Please enter a valid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is required").max(50),
    lastName: zod_1.z.string().min(1, "Last name is required").max(50),
    email: zod_1.z.string().email("Please enter a valid email address"),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    phone: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    role: zod_1.z.enum(["ADMIN", "PROCUREMENT_OFFICER", "VENDOR", "MANAGER"]).default("PROCUREMENT_OFFICER"),
    additionalInfo: zod_1.z.string().optional(),
});
