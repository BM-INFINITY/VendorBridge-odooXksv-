"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ success: false, error: "Unauthorized: Missing token" });
        return;
    }
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "vJ0p8yR7Z+UfXw8lD1kQh/PZ6vM8N5B3+t8Y0u2m4K8=";
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            firstName: decoded.firstName,
            lastName: decoded.lastName,
        };
        next();
    }
    catch (error) {
        res.status(403).json({ success: false, error: "Forbidden: Invalid or expired token" });
    }
};
exports.authenticateJWT = authenticateJWT;
const requireRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: "Unauthorized" });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ success: false, error: "Forbidden: Access denied for your role" });
            return;
        }
        next();
    };
};
exports.requireRoles = requireRoles;
