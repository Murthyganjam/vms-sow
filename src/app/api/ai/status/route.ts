import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/** GET /api/ai/status — returns whether OpenAI is configured (for UI hint). */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ configured: false }, { status: 200 });
  }
  const configured = Boolean(
    process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0
  );
  return NextResponse.json({ configured });
}
