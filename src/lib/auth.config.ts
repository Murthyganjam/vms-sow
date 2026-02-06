import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import Credentials from "next-auth/providers/credentials";

const LOGIN = "/login";
const DASHBOARD = "/dashboard";

/**
 * Edge-safe auth config: no Prisma, no bcrypt, no DB.
 * Used by middleware for session check (JWT decoded from cookie).
 * Full auth (auth.ts) spreads this and adds adapter + real Credentials provider.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" as const, maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: LOGIN },
  providers: [
    // Stub so NextAuthConfig is satisfied; middleware only decodes cookie, never calls authorize.
    Credentials({ credentials: {}, authorize: () => null }),
  ],
  callbacks: {
    authorized({ request, auth }) {
      const path = request.nextUrl.pathname;
      if (path === LOGIN && auth) return NextResponse.redirect(new URL(DASHBOARD, request.url));
      if (path === LOGIN) return true;
      if (!auth) return NextResponse.redirect(new URL(LOGIN, request.url));
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.role = (user as { role?: Role }).role;
        token.isActive = (user as { isActive?: boolean }).isActive;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
