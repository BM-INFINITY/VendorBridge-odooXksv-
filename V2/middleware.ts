import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

// -----------------------------------------------------------------------------
// Next.js Middleware — Route Protection
//
// Runs on the Edge Runtime (fast, no Node.js APIs).
// Protects all dashboard routes by checking for a valid NextAuth JWT session.
// -----------------------------------------------------------------------------

// Extract the middleware wrapper from NextAuth initialized with the Edge config
const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = ["/login", "/register"];
const AUTH_API_PREFIX = "/api/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow NextAuth API routes through
  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next();
  }

  const isAuthenticated = !!req.auth;

  // If on a public route and already authenticated → redirect to dashboard
  if (PUBLIC_ROUTES.includes(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // All other routes require authentication
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Protect all routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
