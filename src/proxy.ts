import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user;
  const path = nextUrl.pathname;

  const redirectToLogin = () => {
    const url = new URL("/connexion", nextUrl.origin);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  };

  if (path.startsWith("/admin")) {
    if (!user || user.role !== "ADMIN") return redirectToLogin();
  }

  if (path.startsWith("/club/dashboard")) {
    if (!user || user.role !== "CLUB") return redirectToLogin();
  }

  if (path.startsWith("/compte")) {
    if (!user) return redirectToLogin();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/club/dashboard/:path*", "/compte/:path*"],
};
