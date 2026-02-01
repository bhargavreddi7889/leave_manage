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
          token.role === "HOD"
            ? "/hod/dashboard"
            : "/employee/dashboard",
          req.url
        )
      );
    }

    // HOD ROUTES
    if (path.startsWith("/hod") && !["ADMIN", "HOD"].includes(token.role)) {
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
            : "/hod/dashboard",
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
    "/hod/:path*",
    "/employee/:path*",
    "/profile/:path*",
  ],
};
