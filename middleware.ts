import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ACCESS_COOKIE } from "@/lib/auth/config";

const encoder = new TextEncoder();
const secret = () => encoder.encode(process.env.AUTH_JWT_SECRET ?? "dev-insecure-secret-change-me-please-32chars!!");

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "MODERATOR"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin shell (everything under /admin except /admin/login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = req.cookies.get(ACCESS_COOKIE)?.value;
    if (!token) return redirectToLogin(req);
    try {
      const { payload } = await jwtVerify(token, secret());
      if (payload.typ !== "access") return redirectToLogin(req);
      if (!ADMIN_ROLES.has(String(payload.role))) {
        return NextResponse.redirect(new URL("/?auth_error=forbidden", req.url));
      }
    } catch {
      return redirectToLogin(req);
    }
  }

  return NextResponse.next();
}

function redirectToLogin(req: NextRequest) {
  const url = new URL("/admin/login", req.url);
  url.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
