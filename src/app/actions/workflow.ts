"use server";

import { auth } from "@/lib/auth";
import * as workflow from "@/lib/workflow";
import { revalidatePath } from "next/cache";

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function submitSOWAction(sowId: string) {
  const { user } = await getSession();
  if (user.role !== "HIRING_MANAGER") throw new Error("Only Hiring Manager can submit.");
  await workflow.submitSOW(sowId, user.id);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/sows/${sowId}`);
}

export async function opsApproveAction(sowId: string, comment?: string) {
  const { user } = await getSession();
  if (user.role !== "OPS_TEAM") throw new Error("Only OPS can approve.");
  await workflow.opsApprove(sowId, user.id, comment);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/sows/${sowId}`);
}

export async function supplierAcceptAction(sowId: string, comment?: string) {
  const { user } = await getSession();
  if (user.role !== "SUPPLIER") throw new Error("Only Supplier can accept.");
  await workflow.supplierAccept(sowId, user.id, comment);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/sows/${sowId}`);
}

export async function supplierRejectAction(sowId: string, comment?: string) {
  const { user } = await getSession();
  if (user.role !== "SUPPLIER") throw new Error("Only Supplier can reject.");
  await workflow.supplierReject(sowId, user.id, comment);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/sows/${sowId}`);
}

export async function financialApproveAction(sowId: string, comment?: string) {
  const { user } = await getSession();
  if (user.role !== "APPROVER") throw new Error("Only Approver can financially approve.");
  await workflow.financialApprove(sowId, user.id, comment);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/sows/${sowId}`);
}

export async function financialRejectAction(sowId: string, comment?: string) {
  const { user } = await getSession();
  if (user.role !== "APPROVER") throw new Error("Only Approver can financially reject.");
  await workflow.financialReject(sowId, user.id, comment);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/sows/${sowId}`);
}
