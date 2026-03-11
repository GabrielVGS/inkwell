import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/journal", "/insights"];
const authRoutes = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isAuthenticated = !!sessionToken;

  // Redirect unauthenticated users to login
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/journal", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/journal/:path*", "/insights/:path*", "/login", "/register"],
};
