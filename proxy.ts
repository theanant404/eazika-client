import { type NextRequest, NextResponse } from "next/server";

const authRoutes = ["/login", "/register"];
const cousterRoutes = [
  "/",
  "/home",
  "/profile",
  "/orders",
  "/cart",
  "/shop/:shopId",
];
const deleveryRoutes = [
  "/delivery",
  "/delivery/register",
  "/delivery/track",
  "/delivery/map",
  "/delivery/profile",
];
const shopRoutes = [
  "/shop",
  "/shop/register",
  "/shop/verify",
  "/shop/setup",
  "/shop/onboarding",
];
const adminRoutes = ["/admin", "/admin/users", "/admin/shops", "/admin/orders"];

export async function proxy(req: NextRequest) {
  const token = (await req.cookies.get("accessToken")?.value) || null;
  const userRole = (await req.cookies.get("userRole")?.value) || "user";
  const pathname = req.nextUrl.pathname;

  if (token) {
    if (authRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL(`/?msg=already_logged_in`, req.url));
    }

    if (pathname.startsWith("/admin") && userRole !== "admin") {
      return NextResponse.redirect(
        new URL(`/?msg=unauthorized_for_admin_page`, req.url)
      );
    } else if (pathname.startsWith("/shop") && userRole !== "shopkeeper") {
      if (pathname === "/shop/register") return NextResponse.next(); // allow shop registration
      return NextResponse.redirect(
        new URL(`/?msg=unauthorized_for_shop_page`, req.url)
      );
    } else if (
      pathname.startsWith("/delivery") &&
      userRole !== "delivery_boy"
    ) {
      if (pathname === "/delivery/register") return NextResponse.next(); // allow delivery registration
      return NextResponse.redirect(
        new URL("/?msg=unauthorized_for_delivery_page", req.url)
      );
    }
    // } else if (cousterRoutes.includes(pathname) && userRole !== "user") {
    //   return NextResponse.redirect(new URL("/", req.url));
  } else {
    if (
      [
        ...cousterRoutes,
        ...deleveryRoutes,
        ...shopRoutes,
        ...adminRoutes,
      ].includes(pathname)
    ) {
      return NextResponse.redirect(
        new URL(`/login?redirect=${pathname}`, req.url)
      );
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
