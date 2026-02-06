import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

export type SowDraftResponse = {
  title: string;
  description: string | null;
  templateType: "MANAGED_PROJECT" | "MANAGED_SERVICE" | "T_M";
  language: string | null;
  effectiveDate: string | null;
  endDate: string | null;
  costCenter: string | null;
  location: string | null;
  outOfScope: string | null;
  assumptions: string | null;
  clientPocName: string | null;
  clientPocEmail: string | null;
  paymentTerms: string | null;
  milestones: {
    title: string;
    amount: number;
    dueDate: string | null;
    recurring: boolean;
    acceptanceCriteria: string | null;
    acceptanceMethod: string | null;
  }[];
};

const SYSTEM_PROMPT = `You are an expert at writing Statements of Work (SOW). Given a short brief from the user, you must output a valid JSON object (no markdown, no code fence) that pre-fills an SOW form. Use this exact structure:

{
  "title": "string",
  "description": "string or null",
  "templateType": "MANAGED_PROJECT" | "MANAGED_SERVICE" | "T_M",
  "language": "en" | "es" | "fr" | "de" | null,
  "effectiveDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "costCenter": "string or null",
  "location": "string or null",
  "outOfScope": "string or null",
  "assumptions": "string or null",
  "clientPocName": "string or null",
  "clientPocEmail": "string or null",
  "paymentTerms": "string or null",
  "milestones": [
    {
      "title": "string",
      "amount": number,
      "dueDate": "YYYY-MM-DD or null",
      "recurring": boolean,
      "acceptanceCriteria": "string or null",
      "acceptanceMethod": "Sign-off" | "Test report" | "Demo" | "Documentation" | null
    }
  ]
}

Rules:
- templateType must be exactly one of: MANAGED_PROJECT, MANAGED_SERVICE, T_M.
- Include at least one milestone with title and amount.
- RECURRING + DURATION: When the brief specifies a recurring fee and a duration (e.g. "per month for one year", "$10000 per month for 12 months", "monthly fee for one year starting March 1"), generate ONE milestone per period: e.g. 12 milestones for 12 months, each with the same per-period amount and dueDate set to the 1st (or stated start) of each month. Set "recurring": true on each. Use the brief's start date for the first dueDate and increment by one month for each subsequent milestone. Do not cap at 4—generate the full number of periods (e.g. 12 for one year monthly).
- For MANAGED_SERVICE without an explicit "per month for N months" style: include 2-4 recurring milestones with "recurring": true (e.g. "Monthly managed service fee", "Quarterly SLA review"). For one-off deliverables use "recurring": false.
- For MANAGED_PROJECT or T_M use "recurring": false unless the brief explicitly asks for recurring payments. Use 2-4 milestones for phases/deliverables.
- Use realistic amounts and dates. Infer effectiveDate/endDate from the brief when possible (e.g. "starting March 1" → effectiveDate "YYYY-03-01", "one year" → endDate one year after start).
- Output only the JSON object, no other text.`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "HIRING_MANAGER") {
    return NextResponse.json({ error: "Only Hiring Manager can draft SOWs" }, { status: 403 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured. Add OPENAI_API_KEY to .env" },
      { status: 503 }
    );
  }

  let body: { brief: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const brief = String(body.brief ?? "").trim();
  if (!brief) {
    return NextResponse.json({ error: "Brief is required" }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generate an SOW draft from this brief:\n\n${brief}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "No response from AI" }, { status: 502 });
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const draft: SowDraftResponse = {
      title: typeof parsed.title === "string" ? parsed.title : "Draft SOW",
      description: typeof parsed.description === "string" ? parsed.description : null,
      templateType:
        parsed.templateType === "MANAGED_SERVICE" || parsed.templateType === "T_M"
          ? parsed.templateType
          : "MANAGED_PROJECT",
      language:
        typeof parsed.language === "string" && ["en", "es", "fr", "de"].includes(parsed.language)
          ? parsed.language
          : null,
      effectiveDate: typeof parsed.effectiveDate === "string" ? parsed.effectiveDate : null,
      endDate: typeof parsed.endDate === "string" ? parsed.endDate : null,
      costCenter: typeof parsed.costCenter === "string" ? parsed.costCenter : null,
      location: typeof parsed.location === "string" ? parsed.location : null,
      outOfScope: typeof parsed.outOfScope === "string" ? parsed.outOfScope : null,
      assumptions: typeof parsed.assumptions === "string" ? parsed.assumptions : null,
      clientPocName: typeof parsed.clientPocName === "string" ? parsed.clientPocName : null,
      clientPocEmail: typeof parsed.clientPocEmail === "string" ? parsed.clientPocEmail : null,
      paymentTerms: typeof parsed.paymentTerms === "string" ? parsed.paymentTerms : null,
      milestones: Array.isArray(parsed.milestones)
        ? (parsed.milestones as Record<string, unknown>[])
            .filter(
              (m) =>
                m && typeof m.title === "string" && typeof m.amount === "number" && m.amount > 0
            )
            .map((m) => ({
              title: String(m.title),
              amount: Number(m.amount),
              dueDate: typeof m.dueDate === "string" ? m.dueDate : null,
              recurring: Boolean(m.recurring),
              acceptanceCriteria:
                typeof m.acceptanceCriteria === "string" ? m.acceptanceCriteria : null,
              acceptanceMethod:
                typeof m.acceptanceMethod === "string" ? m.acceptanceMethod : null,
            }))
        : [],
    };

    if (draft.milestones.length === 0) {
      draft.milestones = [{ title: "Phase 1 delivery", amount: 0, dueDate: null, recurring: false, acceptanceCriteria: null, acceptanceMethod: null }];
    }

    return NextResponse.json(draft);
  } catch (e) {
    console.error("OpenAI SOW draft error:", e);
    const message = e instanceof Error ? e.message : "AI draft failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
