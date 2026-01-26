import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If token somehow missing, let NextAuth handle it
    if (!token) return NextResponse.next();

    // ADMIN ROUTES
    if (path.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL(
          token.role === "MANAGER"
            ? "/manager/dashboard"
            : "/employee/dashboard",
          req.url
        )
      );
    }

    // MANAGER ROUTES
    if (path.startsWith("/manager") && !["ADMIN", "MANAGER"].includes(token.role)) {
      return NextResponse.redirect(
        new URL("/employee/dashboard", req.url)
      );
    }

    // EMPLOYEE ROUTES
    if (path.startsWith("/employee") && token.role !== "EMPLOYEE") {
      return NextResponse.redirect(
        new URL(
          token.role === "ADMIN"
            ? "/admin/dashboard"
            : "/manager/dashboard",
          req.url
        )
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // ✅ Let NextAuth decide authentication
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/manager/:path*",
    "/employee/:path*",
    "/profile/:path*",
  ],
};
