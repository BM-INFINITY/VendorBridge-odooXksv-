import NextAuth from "next-auth";
import type { UserRole } from "@prisma/client";

// Extend the default NextAuth types to include custom fields.
declare module "next-auth" {
  interface User {
    role: UserRole;
    firstName: string;
    lastName: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: UserRole;
      firstName: string;
      lastName: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  }
}
