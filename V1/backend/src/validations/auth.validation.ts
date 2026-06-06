import { z } from "zod";

// -----------------------------------------------------------------------------
// Auth Validation Schemas (Zod)
// Used by Server Actions for runtime type safety.
// -----------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
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

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
