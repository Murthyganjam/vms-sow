import { prisma } from "@/lib/prisma";
import { SOWStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const STEPS = ["OPS_REVIEW", "SUPPLIER_REVIEW", "FINANCIAL_APPROVAL"] as const;

export type WorkflowStep = (typeof STEPS)[number];

/** Ensure approval rows exist for a SOW (create when HM submits). */
export async function ensureApprovalSteps(sowId: string) {
  for (const step of STEPS) {
    await prisma.sOWApproval.upsert({
      where: { sowId_step: { sowId, step } },
      update: {},
      create: { sowId, step, status: "PENDING" },
    });
  }
}

/** After HM submit: set status SUBMITTED, create OPS step PENDING. */
export async function submitSOW(sowId: string, submittedByUserId: string) {
  const sow = await prisma.sOW.findUniqueOrThrow({ where: { id: sowId } });
  if (sow.status !== SOWStatus.DRAFT) throw new Error("SOW must be in DRAFT to submit.");
  await prisma.$transaction([
    prisma.sOW.update({
      where: { id: sowId },
      data: { status: SOWStatus.SUBMITTED, submittedById: submittedByUserId },
    }),
    prisma.sOWApproval.upsert({
      where: { sowId_step: { sowId, step: "OPS_REVIEW" } },
      update: { status: "PENDING" },
      create: { sowId, step: "OPS_REVIEW", status: "PENDING" },
    }),
  ]);
}

/** OPS approves → status OPS_APPROVED, Supplier step PENDING. */
export async function opsApprove(sowId: string, opsUserId: string, comment?: string) {
  const sow = await prisma.sOW.findUniqueOrThrow({ where: { id: sowId } });
  if (sow.status !== SOWStatus.SUBMITTED) throw new Error("SOW must be SUBMITTED for OPS approval.");
  await prisma.$transaction([
    prisma.sOW.update({ where: { id: sowId }, data: { status: SOWStatus.OPS_APPROVED } }),
    prisma.sOWApproval.update({
      where: { sowId_step: { sowId, step: "OPS_REVIEW" } },
      data: { status: "APPROVED", opsApproverId: opsUserId, actedAt: new Date(), comment },
    }),
    prisma.sOWApproval.upsert({
      where: { sowId_step: { sowId, step: "SUPPLIER_REVIEW" } },
      update: { status: "PENDING" },
      create: { sowId, step: "SUPPLIER_REVIEW", status: "PENDING" },
    }),
  ]);
}

/** Supplier accepts → status PENDING_FINANCIAL_APPROVAL (financial approval by signature limit). */
export async function supplierAccept(sowId: string, supplierUserId: string, comment?: string) {
  const sow = await prisma.sOW.findUniqueOrThrow({ where: { id: sowId } });
  if (sow.status !== SOWStatus.OPS_APPROVED)
    throw new Error("SOW must be OPS_APPROVED for supplier to accept.");
  await prisma.$transaction([
    prisma.sOW.update({
      where: { id: sowId },
      data: { status: SOWStatus.PENDING_FINANCIAL_APPROVAL },
    }),
    prisma.sOWApproval.update({
      where: { sowId_step: { sowId, step: "SUPPLIER_REVIEW" } },
      data: { status: "APPROVED", supplierUserId, actedAt: new Date(), comment },
    }),
    prisma.sOWApproval.upsert({
      where: { sowId_step: { sowId, step: "FINANCIAL_APPROVAL" } },
      update: { status: "PENDING" },
      create: { sowId, step: "FINANCIAL_APPROVAL", status: "PENDING" },
    }),
  ]);
}

/** Supplier rejects. */
export async function supplierReject(sowId: string, supplierUserId: string, comment?: string) {
  const sow = await prisma.sOW.findUniqueOrThrow({ where: { id: sowId } });
  if (sow.status !== SOWStatus.OPS_APPROVED)
    throw new Error("SOW must be OPS_APPROVED for supplier to reject.");
  await prisma.$transaction([
    prisma.sOW.update({ where: { id: sowId }, data: { status: SOWStatus.SUPPLIER_REJECTED } }),
    prisma.sOWApproval.update({
      where: { sowId_step: { sowId, step: "SUPPLIER_REVIEW" } },
      data: { status: "REJECTED", supplierUserId, actedAt: new Date(), comment },
    }),
  ]);
}

/** Find approvers whose signature limit >= SOW total value (for financial approval). */
export async function getEligibleFinancialApprovers(sowTotalValue: Decimal | null) {
  if (sowTotalValue == null) return [];
  const amount = Number(sowTotalValue);
  const limits = await prisma.signatureAuthorityLimit.findMany({
    where: { limitAmount: { gte: amount } },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { limitAmount: "asc" },
  });
  return limits.map((l) => l.user);
}

/** Financial approver approves (must have signature limit >= SOW value). */
export async function financialApprove(
  sowId: string,
  approverUserId: string,
  comment?: string
) {
  const sow = await prisma.sOW.findUniqueOrThrow({ where: { id: sowId } });
  if (sow.status !== SOWStatus.PENDING_FINANCIAL_APPROVAL)
    throw new Error("SOW must be PENDING_FINANCIAL_APPROVAL.");
  const limit = await prisma.signatureAuthorityLimit.findUnique({
    where: { userId: approverUserId },
  });
  if (!limit || Number(limit.limitAmount) < Number(sow.totalValue ?? 0))
    throw new Error("Your signature authority limit is below this SOW value.");
  await prisma.$transaction([
    prisma.sOWApproval.update({
      where: { sowId_step: { sowId, step: "FINANCIAL_APPROVAL" } },
      data: { status: "APPROVED", financialApproverId: approverUserId, actedAt: new Date(), comment },
    }),
    prisma.sOW.update({ where: { id: sowId }, data: { status: SOWStatus.ACTIVE } }),
  ]);
}

/** Financial approver rejects. */
export async function financialReject(
  sowId: string,
  approverUserId: string,
  comment?: string
) {
  const sow = await prisma.sOW.findUniqueOrThrow({ where: { id: sowId } });
  if (sow.status !== SOWStatus.PENDING_FINANCIAL_APPROVAL)
    throw new Error("SOW must be PENDING_FINANCIAL_APPROVAL.");
  await prisma.$transaction([
    prisma.sOW.update({ where: { id: sowId }, data: { status: SOWStatus.FINANCIALLY_REJECTED } }),
    prisma.sOWApproval.update({
      where: { sowId_step: { sowId, step: "FINANCIAL_APPROVAL" } },
      data: { status: "REJECTED", financialApproverId: approverUserId, actedAt: new Date(), comment },
    }),
  ]);
}
