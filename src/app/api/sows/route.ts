import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sows = await prisma.sOW.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      vendor: { select: { id: true, name: true } },
      submittedBy: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json(sows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "HIRING_MANAGER") {
    return NextResponse.json({ error: "Only Hiring Manager can create SOW" }, { status: 403 });
  }
  let body: {
    title: string;
    description?: string | null;
    templateType?: string;
    language?: string | null;
    effectiveDate?: string | null;
    endDate?: string | null;
    costCenter?: string | null;
    location?: string | null;
    outOfScope?: string | null;
    assumptions?: string | null;
    clientPocName?: string | null;
    clientPocEmail?: string | null;
    milestones?: {
      title: string;
      amount: number;
      dueDate?: string | null;
      recurring?: boolean;
      acceptanceCriteria?: string | null;
      acceptanceMethod?: string | null;
    }[];
    paymentTerms?: string | null;
    vendorId?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  const templateType =
    body.templateType === "MANAGED_SERVICE" || body.templateType === "T_M"
      ? body.templateType
      : "MANAGED_PROJECT";
  const language = body.language && String(body.language).trim() ? String(body.language).trim() : null;
  const effectiveDate = body.effectiveDate && String(body.effectiveDate).trim() ? new Date(body.effectiveDate) : null;
  const endDate = body.endDate && String(body.endDate).trim() ? new Date(body.endDate) : null;
  const costCenter = body.costCenter && String(body.costCenter).trim() ? String(body.costCenter).trim() : null;
  const location = body.location && String(body.location).trim() ? String(body.location).trim() : null;
  const outOfScope = body.outOfScope && String(body.outOfScope).trim() ? String(body.outOfScope).trim() : null;
  const assumptions = body.assumptions && String(body.assumptions).trim() ? String(body.assumptions).trim() : null;
  const clientPocName = body.clientPocName && String(body.clientPocName).trim() ? String(body.clientPocName).trim() : null;
  const clientPocEmail = body.clientPocEmail && String(body.clientPocEmail).trim() ? String(body.clientPocEmail).trim() : null;
  const paymentTerms = body.paymentTerms && String(body.paymentTerms).trim() ? String(body.paymentTerms).trim() : null;
  const vendorId =
    body.vendorId && String(body.vendorId).trim() ? String(body.vendorId).trim() : null;

  const milestones = Array.isArray(body.milestones)
    ? body.milestones.filter(
        (m) =>
          m && typeof m.title === "string" && m.title.trim() && Number.isFinite(Number(m.amount)) && Number(m.amount) > 0
      )
    : [];
  const totalValue =
    milestones.length > 0
      ? milestones.reduce((sum, m) => sum + Number(m.amount), 0)
      : null;

  const sow = await prisma.sOW.create({
    data: {
      title,
      description: body.description ?? null,
      templateType,
      language,
      effectiveDate,
      endDate,
      costCenter,
      location,
      outOfScope,
      assumptions,
      clientPocName,
      clientPocEmail,
      totalValue,
      paymentTerms,
      vendorId,
      status: "DRAFT",
      milestones:
        milestones.length > 0
          ? {
              create: milestones.map((m, i) => ({
                title: String(m.title).trim(),
                amount: Number(m.amount),
                dueDate: m.dueDate && String(m.dueDate).trim() ? new Date(m.dueDate) : null,
                order: i,
                recurring: Boolean(m.recurring),
                acceptanceCriteria: m.acceptanceCriteria && String(m.acceptanceCriteria).trim() ? String(m.acceptanceCriteria).trim() : null,
                acceptanceMethod: m.acceptanceMethod && String(m.acceptanceMethod).trim() ? String(m.acceptanceMethod).trim() : null,
              })),
            }
          : undefined,
    },
  });
  return NextResponse.json({ id: sow.id });
}
