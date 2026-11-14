import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Using jose for Edge Runtime compatibility
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-jwt-key-change-me"
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicRoutes = ["/login", "/api/auth/login", "/api/auth/logout"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // files like .ico, .png (heuristic)
  ) {
    return NextResponse.next();
  }

  // API routes must never receive an HTML redirect: clients do res.json()
  // on them and an HTML login page would crash with
  // "Unexpected token '<', ... is not valid JSON". Return JSON 401 instead.
  if (pathname.startsWith("/api/")) {
    const json401 = (message: string) =>
      NextResponse.json({ error: message }, { status: 401 });

    if (!token) {
      return json401("Chưa đăng nhập hoặc phiên đã hết hạn");
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (error) {
      console.error("Token verification failed:", error);
      const unauthorized = json401("Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại");
      unauthorized.cookies.delete("auth_token");
      return unauthorized;
    }
  }

  if (!token) {
    // Redirect to login if no token
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  try {
    // Verify token
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    console.error("Token verification failed:", error);
    // Redirect to login if token is invalid
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const response = NextResponse.redirect(url);
    response.cookies.delete("auth_token");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
