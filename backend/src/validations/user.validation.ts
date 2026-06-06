import { z } from "zod";

export const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z.string().optional(),
  country: z.string().optional(),
  role: z.enum(["ADMIN", "PROCUREMENT_OFFICER", "VENDOR", "MANAGER"]).default("PROCUREMENT_OFFICER"),
  additionalInfo: z.string().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50).optional(),
  lastName: z.string().min(1, "Last name is required").max(50).optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "PROCUREMENT_OFFICER", "VENDOR", "MANAGER"]).optional(),
  additionalInfo: z.string().optional().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
