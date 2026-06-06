"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth.validation";
import { logActivity } from "./activity.actions";

// -----------------------------------------------------------------------------
// Server Action Response Type
// -----------------------------------------------------------------------------
export type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

// -----------------------------------------------------------------------------
// registerUser
// Creates a new user account with hashed password.
// -----------------------------------------------------------------------------
export async function registerUser(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    country: formData.get("country") || undefined,
    role: formData.get("role") || undefined,
    additionalInfo: formData.get("additionalInfo") || undefined,
  };

  // 1. Validate input
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { firstName, lastName, email, password, phone, country, role, additionalInfo } =
    parsed.data;

  // 2. Check email uniqueness
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return { success: false, error: "An account with this email already exists." };
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // 4. Create user
  const user = await db.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      country,
      role: role as any,
      additionalInfo,
    },
  });

  // 5. Log activity
  await logActivity({
    userId: user.id,
    action: "USER_REGISTERED",
    module: "USER",
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  return { success: true };
}

// -----------------------------------------------------------------------------
// loginUser
// Delegates to NextAuth Credentials Provider.
// -----------------------------------------------------------------------------
export async function loginUser(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password." };
        default:
          return { success: false, error: "An error occurred. Please try again." };
      }
    }
    throw error;
  }
}

// -----------------------------------------------------------------------------
// logoutUser
// Ends the current session.
// -----------------------------------------------------------------------------
export async function logoutUser(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
