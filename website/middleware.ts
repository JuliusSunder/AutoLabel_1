import { NextResponse } from "next/server";

export function middleware(req: any) {
  const p = req.nextUrl.pathname;
  const c = req.cookies.get("__Secure-authjs.session-token") || req.cookies.get("authjs.session-token");
  if ((p.startsWith("/dashboard") || p.startsWith("/download")) && !c) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(p)}`, req.url));
  }
  if ((p.startsWith("/login") || p.startsWith("/register")) && c) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/download/:path*", "/login", "/register"],
};

