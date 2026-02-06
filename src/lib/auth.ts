import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // required for Railway/Vercel etc. (fixes UntrustedHost)
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        const hasPassword = password.length > 0;
        console.log("[auth] authorize: email=", email || "(empty)", "passwordPresent=", hasPassword);
        if (!email || !password) {
          console.log("[auth] reject: missing email or password");
          return null;
        }
        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email, isActive: true },
          });
        } catch (e) {
          console.error("[auth] DB error:", e instanceof Error ? e.message : String(e));
          return null;
        }
        if (!user) {
          console.log("[auth] reject: no user found for email=", email);
          return null;
        }
        if (!user.passwordHash) {
          console.log("[auth] reject: user has no passwordHash, id=", user.id);
          return null;
        }
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          console.log("[auth] reject: password mismatch for email=", email);
          return null;
        }
        console.log("[auth] success: id=", user.id, "email=", email);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          isActive: user.isActive,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ request, auth: token }) {
      const path = request.nextUrl.pathname;
      if (path === "/login") return true;
      return !!token;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role;
        token.isActive = (user as { isActive?: boolean }).isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as import("@prisma/client").Role;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
  },
});
