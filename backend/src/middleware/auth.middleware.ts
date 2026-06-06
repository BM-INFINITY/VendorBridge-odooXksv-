import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { db } from "../db";

// Extend Express Request interface to include the authenticated user context
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  };
}

export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Unauthorized: Missing token" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "vJ0p8yR7Z+UfXw8lD1kQh/PZ6vM8N5B3+t8Y0u2m4K8=";

  try {
    const decoded = jwt.verify(token, secret) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };

    // Strict guard for unapproved vendors on all protected routes except /me
    const isMeRoute = req.originalUrl.includes("/api/auth/me");
    if (!isMeRoute && req.user.role === "VENDOR") {
      const vendor = await db.vendor.findUnique({ where: { email: req.user.email } });
      if (!vendor || vendor.status !== "ACTIVE") {
        res.status(403).json({ 
          success: false, 
          error: "Forbidden: Your vendor account is pending administrative approval." 
        });
        return;
      }
    }

    next();
  } catch (error) {
    res.status(403).json({ success: false, error: "Forbidden: Invalid or expired token" });
  }
};

export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
