import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { createUserSchema, updateUserSchema } from "../validations/user.validation";
import { authenticateJWT, requireRoles, AuthenticatedRequest } from "../middleware/auth.middleware";
import { logActivity } from "../services/activity.service";
import { UserRole } from "@prisma/client";

const router = Router();

// Guard all routes in this file to ADMIN only
router.use(authenticateJWT);
router.use(requireRoles([UserRole.ADMIN]));

// GET /api/users - List all users
router.get("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query;

    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: String(search), mode: "insensitive" } },
        { lastName: { contains: String(search), mode: "insensitive" } },
        { email: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        country: true,
        role: true,
        additionalInfo: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch users" });
  }
});

// GET /api/users/:id - Get user details
router.get("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        country: true,
        role: true,
        additionalInfo: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to fetch user" });
  }
});

// POST /api/users - Create a user
router.post("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { firstName, lastName, email, password, phone, country, role, additionalInfo } = parsed.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, error: "A user with this email already exists." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone: phone || undefined,
        country: country || undefined,
        role,
        additionalInfo: additionalInfo || undefined,
      },
    });

    await logActivity({
      userId: req.user!.id,
      action: "USER_CREATED",
      module: "USER",
      entityId: user.id,
      metadata: { createdUserEmail: user.email, role: user.role },
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to create user" });
  }
});

// PUT /api/users/:id - Update user details
router.put("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const updateData: any = { ...parsed.data };
    
    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    } else {
      delete updateData.password;
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
    });

    await logActivity({
      userId: req.user!.id,
      action: "USER_UPDATED",
      module: "USER",
      entityId: user.id,
      metadata: { updatedUserEmail: user.email, role: user.role },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to update user" });
  }
});

// DELETE /api/users/:id - Delete a user
router.delete("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      res.status(400).json({ success: false, error: "You cannot delete your own account." });
      return;
    }

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    await db.user.delete({ where: { id } });

    await logActivity({
      userId: req.user!.id,
      action: "USER_DELETED",
      module: "USER",
      entityId: id,
      metadata: { deletedUserEmail: existingUser.email },
    });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to delete user" });
  }
});

export default router;
