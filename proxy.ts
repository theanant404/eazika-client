import { type NextRequest, NextResponse } from "next/server";

type UserRoleType = "admin" | "user" | "delivery_boy" | "shopkeeper";

// Public routes that don't require authentication
const publicRoutes = ["/login", "/register", "/contact-us", "/privacy-policy", "/terms-and-condition"];

export async function proxy(req: NextRequest) {
  const token = (await req.cookies.get("accessToken")?.value) || null;
  const userRole: UserRoleType =
    ((await req.cookies.get("userRole")?.value) as UserRoleType) || "user";
  const pathname = req.nextUrl.pathname;

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Admin can access everything once authenticated
  const isAdmin = userRole === "admin";

  // If user is logged in and trying to access auth pages, redirect to home
  if (token && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    // Allow role-specific login pages like /login/admin to pass through for redirect handling
    if (pathname === "/login/admin") return NextResponse.next();
    return NextResponse.redirect(new URL("/?msg=already_logged_in", req.url));
  }

  // If no token and trying to access protected routes, redirect to login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL(`/login?redirect=${pathname}`, req.url));
  }

  // If user has token, check role-based access
  if (token) {
    // Admin bypasses all checks
    if (isAdmin) return NextResponse.next();

    // ADMIN ROUTES - Only admin can access
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/?msg=unauthorized_access", req.url));
    }

    // SHOP ROUTES - Shopkeeper or admin (handled above); registration open for users
    if (pathname.startsWith("/shop")) {
      if (pathname === "/shop/register" && userRole === "user") return NextResponse.next();
      if (pathname === "/shop/register" && userRole === "shopkeeper") {
        return NextResponse.redirect(new URL("/shop", req.url));
      }
      if (userRole !== "shopkeeper") {
        return NextResponse.redirect(new URL("/?msg=unauthorized_access", req.url));
      }
      return NextResponse.next();
    }

    // RIDER ROUTES - Delivery or admin (handled above); registration open for users
    if (pathname.startsWith("/rider")) {
      if (pathname === "/rider/register" && userRole === "user") return NextResponse.next();
      if (pathname === "/rider/register" && userRole === "delivery_boy") {
        return NextResponse.redirect(new URL("/rider", req.url));
      }
      if (userRole !== "delivery_boy") {
        return NextResponse.redirect(new URL("/?msg=unauthorized_access", req.url));
      }
      return NextResponse.next();
    }

    // CUSTOMER ROUTES - riders and shopkeepers can also access
    const customerRoutes = ["/cart", "/checkout", "/wishlist"];
    if (customerRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json).*)",
    "/admin/:path*",
    "/shop/:path*",
    "/delivery/:path*",
  ],
};
