import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// -----------------------------------------------------------------------------
// Next.js Middleware — Route Protection
//
// Runs on the Edge Runtime (fast, no Node.js APIs).
// Protects all dashboard routes by checking for a valid NextAuth JWT session.
//
// Route Strategy:
//   - /login, /register      → Public (redirect to /dashboard if authenticated)
//   - /api/auth/**           → Always public (NextAuth handlers)
//   - Everything else        → Protected (redirect to /login if unauthenticated)
// -----------------------------------------------------------------------------

const PUBLIC_ROUTES = ["/login", "/register"];
const AUTH_API_PREFIX = "/api/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow NextAuth API routes through
  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next();
  }

  const session = await auth();
  const isAuthenticated = !!session?.user;

  // If on a public route and already authenticated → redirect to dashboard
  if (PUBLIC_ROUTES.includes(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // All other routes require authentication
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Protect all routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
