import type { NextAuthConfig } from "next-auth";

// -----------------------------------------------------------------------------
// NextAuth.js Base Config (Edge Compatible)
//
// Kept separate from auth.ts so it can be imported in middleware.ts
// without pulling in Prisma/bcrypt (which are not Edge-compatible).
// -----------------------------------------------------------------------------

export const authConfig: NextAuthConfig = {
  providers: [], // Empty array here; the actual provider is injected in auth.ts
  session: { strategy: "jwt" },
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
};
