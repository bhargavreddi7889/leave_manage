import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmailOrMobile, verifyPassword } from "@/lib/auth";
import { UserRole } from "@/types/database";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Mobile", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        // Get user by email or mobile
        const user = await getUserByEmailOrMobile(credentials.identifier);

        // Check if user exists and is active
        if (!user || !user.isActive) {
          return null;
        }

        // Verify password
        const isValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          mobile: user.mobile,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          employeeId: user.employeeId,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Ensure role is always HOD if it was MANAGER (for migration compatibility)
        let role = (user as any).role;
        if (role === 'MANAGER') {
          role = 'HOD';
        }
        token.role = role as UserRole;
        token.employeeId = (user as any).employeeId;
      } else if ((token.role as any) === 'MANAGER') {
        // Fix old tokens that still have MANAGER role
        token.role = 'HOD';
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        // Ensure role is HOD if token still has MANAGER (migration compatibility)
        let role = token.role as UserRole | string;
        if (role === 'MANAGER') {
          role = 'HOD';
        }
        session.user.role = role as UserRole;
        session.user.employeeId = token.employeeId as string;
      }
      return session;
    },

    // ✅ SAFE redirect (no loops)
    async redirect({ baseUrl }) {
      return `${baseUrl}/dashboard`;
    },
  },

  pages: {
    signIn: "/login",
  },

  // ✅ Cookie configuration - secure only in production
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
