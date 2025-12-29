import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  // Protected routes
  const protectedRoutes = ["/dashboard", "/download"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if not authenticated
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if authenticated and trying to access login/register
  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/download/:path*", "/login", "/register"],
};

