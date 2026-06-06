"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const auth_validation_1 = require("../validations/auth.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const activity_service_1 = require("../services/activity.service"); // We will create this activity service
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "vJ0p8yR7Z+UfXw8lD1kQh/PZ6vM8N5B3+t8Y0u2m4K8=";
// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const parsed = auth_validation_1.registerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: parsed.error.errors[0].message });
            return;
        }
        const { firstName, lastName, email, password, phone, country, role, additionalInfo } = parsed.data;
        const existingUser = await db_1.db.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ success: false, error: "An account with this email already exists." });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await db_1.db.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                phone,
                country,
                role,
                additionalInfo,
            },
        });
        // Log registration
        await (0, activity_service_1.logActivity)({
            userId: user.id,
            action: "USER_REGISTERED",
            module: "USER",
            entityId: user.id,
            metadata: { email: user.email, role: user.role },
        });
        res.status(201).json({ success: true, message: "User registered successfully." });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
});
// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const parsed = auth_validation_1.loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, error: parsed.error.errors[0].message });
            return;
        }
        const { email, password } = parsed.data;
        const user = await db_1.db.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ success: false, error: "Invalid email or password." });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ success: false, error: "Invalid email or password." });
            return;
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
        }, JWT_SECRET, { expiresIn: "24h" });
        // Log login
        await (0, activity_service_1.logActivity)({
            userId: user.id,
            action: "USER_LOGGED_IN",
            module: "USER",
            entityId: user.id,
            metadata: { email: user.email },
        });
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
});
// GET /api/auth/me
router.get("/me", auth_middleware_1.authenticateJWT, (req, res) => {
    res.json({ success: true, data: { user: req.user } });
});
exports.default = router;
