import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  "/points",
  "/portfolio",
  "/settings",
  "/ai",
  "/messages",
  "/referral",
];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  const session = (await cookies()).get("session")?.value;
  if (isProtectedRoute && !session)
    return NextResponse.redirect(new URL("/", req.nextUrl));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
