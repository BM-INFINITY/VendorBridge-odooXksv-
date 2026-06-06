import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { loginSchema, registerSchema } from "../validations/auth.validation";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth.middleware";
import { logActivity } from "../services/activity.service"; // We will create this activity service

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "vJ0p8yR7Z+UfXw8lD1kQh/PZ6vM8N5B3+t8Y0u2m4K8=";

// POST /api/auth/register
router.post("/register", async (req, res): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { firstName, lastName, email, password, phone, country, role, additionalInfo } = parsed.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, error: "An account with this email already exists." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.user.create({
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
    await logActivity({
      userId: user.id,
      action: "USER_REGISTERED",
      module: "USER" as any,
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    res.status(201).json({ success: true, message: "User registered successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    let { email, password } = parsed.data;
    
    // Normalize short usernames to full emails
    const lowerEmail = email.toLowerCase().trim();
    if (lowerEmail === "admin") email = "admin@vendorbridge.com";
    else if (lowerEmail === "officer") email = "officer@vendorbridge.com";
    else if (lowerEmail === "manager") email = "manager@vendorbridge.com";
    else if (lowerEmail === "vendor") email = "vendor@techsupplies.com";

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({ success: false, error: "Invalid email or password." });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, error: "Invalid email or password." });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Log login
    await logActivity({
      userId: user.id,
      action: "USER_LOGGED_IN",
      module: "USER" as any,
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: { user: req.user } });
});

export default router;
