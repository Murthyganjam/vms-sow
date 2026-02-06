import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Use NextAuth's auth() so session is resolved the same way as API routes
 * (decodes JWT from cookie), fixing "stuck on login" after sign-in.
 * authConfig is edge-safe (no Prisma/DB).
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
