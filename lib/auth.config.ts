import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { loginSchema } from "@/lib/validations/auth.validation";

// -----------------------------------------------------------------------------
// NextAuth.js Auth Config
//
// Kept separate from auth.ts so it can be imported in middleware.ts
// without importing the full NextAuth config (which pulls in Prisma/bcrypt
// that are not compatible with the Edge Runtime used in middleware).
// -----------------------------------------------------------------------------

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        // 1. Validate input shape
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // 2. Find user by email
        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        // 3. Compare password hash
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return null;

        // 4. Return user object (will be encoded into JWT)
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.image,
          // Custom fields (available via jwt/session callbacks)
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        } as any;
      },
    }),
  ],
};
