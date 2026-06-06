import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { loginSchema } from "@/lib/validations/auth.validation";
import { authConfig } from "./auth.config";

// -----------------------------------------------------------------------------
// NextAuth.js v5 (Auth.js) — Main Configuration (Node.js Runtime)
//
// This file exports the auth methods used in Server Components/Actions.
// It combines the edge-compatible config with the Credentials provider.
// -----------------------------------------------------------------------------

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.image,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        } as any;
      },
    }),
  ],
});
