"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const client_1 = require("@prisma/client");
// -----------------------------------------------------------------------------
// Prisma Client Singleton
//
// In development, Next.js hot-reload creates new module instances on every
// file change. Without this singleton pattern, each reload would create a
// new PrismaClient — eventually exhausting the connection pool.
//
// Solution: cache the client on `globalThis` in development so the same
// instance is reused across hot reloads. In production, a new instance is
// created once per process.
// -----------------------------------------------------------------------------
const globalForPrisma = globalThis;
exports.db = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.db;
}
