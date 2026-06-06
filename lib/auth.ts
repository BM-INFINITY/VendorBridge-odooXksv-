import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// -----------------------------------------------------------------------------
// NextAuth.js v5 (Auth.js) — Main Configuration
//
// This file exports:
//  - auth()       → used in Server Components and Server Actions to get session
//  - handlers     → GET/POST handlers for app/api/auth/[...nextauth]/route.ts
//  - signIn()     → used in Server Actions to initiate login
//  - signOut()    → used in Server Actions to end session
// -----------------------------------------------------------------------------

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,

  // Session strategy: JWT (no database sessions — faster, stateless)
  session: { strategy: "jwt" },

  // Custom pages
  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    // Persist role and id in the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
      }
      return token;
    },

    // Make token data available in useSession() / auth()
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).firstName = token.firstName;
        (session.user as any).lastName = token.lastName;
      }
      return session;
    },
  },
});
