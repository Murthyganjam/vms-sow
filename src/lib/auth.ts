import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

// Log which DB host we use (no credentials) for debugging
try {
  const u = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
  console.log("[auth] DATABASE_URL host:", u?.hostname ?? "not set");
} catch {
  console.log("[auth] DATABASE_URL host: (invalid URL)");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const rawEmail = String(credentials?.email ?? "").trim();
        const email = rawEmail.toLowerCase();
        const password = String(credentials?.password ?? "");
        const hasPassword = password.length > 0;
        console.log("[auth] authorize: rawEmail=", JSON.stringify(rawEmail), "email=", email || "(empty)", "passwordLen=", password.length);
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
});
