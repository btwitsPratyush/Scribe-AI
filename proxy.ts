import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  const session = req.cookies.get("auth"); // Custom auth session cookie

  // Routes that require login
  const protectedRoutes = ["/recording"];

  const { pathname } = req.nextUrl;

  // Check if user is trying to visit a protected page
  const isProtected = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // If NOT logged in → redirect to login
  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/recording/:path*",
  ],
};