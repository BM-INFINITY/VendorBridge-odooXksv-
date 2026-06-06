import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { loginSchema, registerSchema } from "../validations/auth.validation";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth.middleware";
import { logActivity } from "../services/activity.service";
import { 
  sendOTPEmail, 
  sendVendorRegisteredEmail, 
  sendAdminNewVendorRegisteredEmail 
} from "../services/email.service";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "vJ0p8yR7Z+UfXw8lD1kQh/PZ6vM8N5B3+t8Y0u2m4K8=";

// POST /api/auth/send-otp
router.post("/send-otp", async (req, res): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: "Email address is required." });
      return;
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, error: "An account with this email already exists." });
      return;
    }

    // Generate 6 digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save/update OTP in database
    await (db as any).oTP.upsert({
      where: { email },
      update: { code: otpCode, expiresAt },
      create: { email, code: otpCode, expiresAt },
    });

    // Send email
    await sendOTPEmail(email, otpCode);

    res.json({ success: true, message: "Verification OTP code sent to your email." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to send OTP email." });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { firstName, lastName, email, password, phone, country, companyName, address, additionalInfo } = parsed.data;
    const { otpCode } = req.body;

    if (!otpCode) {
      res.status(400).json({ success: false, error: "OTP verification code is required." });
      return;
    }

    // Verify OTP code
    const otpRecord = await (db as any).oTP.findUnique({ where: { email } });
    if (!otpRecord || otpRecord.code !== otpCode || otpRecord.expiresAt < new Date()) {
      res.status(400).json({ success: false, error: "Invalid or expired OTP verification code." });
      return;
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, error: "An account with this email already exists." });
      return;
    }

    const existingVendor = await db.vendor.findUnique({ where: { email } });
    if (existingVendor) {
      res.status(400).json({ success: false, error: "A vendor profile with this email already exists." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Atomically create User and corresponding Vendor record
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          phone,
          country,
          role: "VENDOR", // Hardcoded security guard
          additionalInfo,
        },
      });

      const vendor = await tx.vendor.create({
        data: {
          vendorName: companyName,
          companyName,
          contactPerson: `${firstName} ${lastName}`,
          email,
          phone,
          address,
          status: "INACTIVE", // Start as INACTIVE (pending Admin approval)
          createdById: user.id,
        },
      });

      // Clear the verified OTP
      await (tx as any).oTP.delete({ where: { email } });

      return { user, vendor };
    });

    // Log registration
    await logActivity({
      userId: result.user.id,
      action: "USER_REGISTERED",
      module: "USER" as any,
      entityId: result.user.id,
      metadata: { email: result.user.email, role: result.user.role },
    });

    // Log vendor creation
    await logActivity({
      userId: result.user.id,
      action: "VENDOR_CREATED",
      module: "VENDOR" as any,
      entityId: result.vendor.id,
      metadata: { companyName: result.vendor.companyName },
    });

    // Send confirmation email to Vendor
    try {
      await sendVendorRegisteredEmail(email, companyName);
    } catch (err) {
      console.error("Failed to send vendor registration confirmation email:", err);
    }

    // Send alerts to all Admins
    try {
      const admins = await db.user.findMany({ where: { role: "ADMIN" } });
      for (const admin of admins) {
        await sendAdminNewVendorRegisteredEmail(admin.email, companyName, `${firstName} ${lastName}`, email);
      }
    } catch (err) {
      console.error("Failed to notify admins of new registration:", err);
    }

    res.status(201).json({ success: true, message: "Vendor registered successfully. Pending approval." });
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

    // Check approval status for Vendor role
    const isApproved = user.role !== "VENDOR" || (await db.vendor.findUnique({ where: { email: user.email } }))?.status === "ACTIVE";

    if (!isApproved) {
      res.status(403).json({ success: false, error: "Your vendor account is pending approval from an Administrator." });
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
          isApproved,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const isApproved = user.role !== "VENDOR" || (await db.vendor.findUnique({ where: { email: user.email } }))?.status === "ACTIVE";
  res.json({ success: true, data: { user: { ...user, isApproved } } });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: "Email address is required." });
      return;
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // For security, don't reveal user existence
      res.json({ success: true, message: "If this email is registered, a password reset code has been sent." });
      return;
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save/update OTP in DB
    await (db as any).oTP.upsert({
      where: { email },
      update: { code: otp, expiresAt },
      create: { email, code: otp, expiresAt },
    });

    // Send email (falls back to console printing on failure)
    await sendOTPEmail(email, otp);

    res.json({
      success: true,
      message: "If this email is registered, a password reset code has been sent.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to process forgot-password request" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res): Promise<void> => {
  try {
    const { email, otpCode, newPassword } = req.body;
    if (!email || !otpCode || !newPassword) {
      res.status(400).json({ success: false, error: "Email, OTP code, and new password are required." });
      return;
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      res.status(400).json({ success: false, error: "Password must be at least 8 characters, contain one uppercase letter and one number." });
      return;
    }

    const otpRecord = await (db as any).oTP.findUnique({ where: { email } });
    if (!otpRecord || otpRecord.code !== otpCode || otpRecord.expiresAt < new Date()) {
      res.status(400).json({ success: false, error: "Invalid or expired verification code." });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Clear OTP
    await (db as any).oTP.delete({ where: { email } });

    res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to reset password." });
  }
});

export default router;

