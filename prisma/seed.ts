import { PrismaClient, Role, SOWStatus, SOWTemplateType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const HASHED_PASSWORD = bcrypt.hashSync("CiscoFeb142026", 10);

async function main() {
  // ─── Dummy users (four roles) ───────────────────────────────────────────

  const hm = await prisma.user.upsert({
    where: { email: "hm@vms.local" },
    update: { passwordHash: HASHED_PASSWORD },
    create: {
      name: "Alex Hiring",
      email: "hm@vms.local",
      passwordHash: HASHED_PASSWORD,
      role: Role.HIRING_MANAGER,
    },
  });

  const ops = await prisma.user.upsert({
    where: { email: "ops@vms.local" },
    update: { passwordHash: HASHED_PASSWORD },
    create: {
      name: "Sam Ops",
      email: "ops@vms.local",
      passwordHash: HASHED_PASSWORD,
      role: Role.OPS_TEAM,
    },
  });

  const approver50 = await prisma.user.upsert({
    where: { email: "approver50@vms.local" },
    update: { passwordHash: HASHED_PASSWORD },
    create: {
      name: "Jordan Approver",
      email: "approver50@vms.local",
      passwordHash: HASHED_PASSWORD,
      role: Role.APPROVER,
    },
  });

  const approver200 = await prisma.user.upsert({
    where: { email: "approver200@vms.local" },
    update: { passwordHash: HASHED_PASSWORD },
    create: {
      name: "Morgan Senior Approver",
      email: "approver200@vms.local",
      passwordHash: HASHED_PASSWORD,
      role: Role.APPROVER,
    },
  });

  const supplier = await prisma.user.upsert({
    where: { email: "supplier@vms.local" },
    update: { passwordHash: HASHED_PASSWORD },
    create: {
      name: "Taylor Supplier",
      email: "supplier@vms.local",
      passwordHash: HASHED_PASSWORD,
      role: Role.SUPPLIER,
    },
  });

  // ─── Signature authority limits (financial approvers) ────────────────────

  await prisma.signatureAuthorityLimit.upsert({
    where: { userId: approver50.id },
    update: { limitAmount: 50_000 },
    create: { userId: approver50.id, limitAmount: 50_000 },
  });

  await prisma.signatureAuthorityLimit.upsert({
    where: { userId: approver200.id },
    update: { limitAmount: 200_000 },
    create: { userId: approver200.id, limitAmount: 200_000 },
  });

  // ─── One vendor (supplier company) ────────────────────────────────────────

  const vendor = await prisma.vendor.upsert({
    where: { code: "SUP-001" },
    update: {},
    create: {
      name: "Acme Staffing Inc.",
      code: "SUP-001",
      email: "contracts@acme.example.com",
    },
  });

  // ─── Optional: one sample SOW in DRAFT ───────────────────────────────────

  await prisma.sOW.upsert({
    where: { id: "seed-sow-1" },
    update: {},
    create: {
      id: "seed-sow-1",
      title: "Sample SOW - IT Implementation",
      description: "Draft statement of work for Phase 1 implementation.",
      templateType: SOWTemplateType.MANAGED_PROJECT,
      status: SOWStatus.DRAFT,
      totalValue: 75_000,
      submittedById: hm.id,
      vendorId: vendor.id,
    },
  });

  console.log("Seed complete.");
  console.log("Users (password for all: CiscoFeb142026):");
  console.log("  Hiring Manager: hm@vms.local");
  console.log("  OPS Team:      ops@vms.local");
  console.log("  Approver $50k: approver50@vms.local");
  console.log("  Approver $200k: approver200@vms.local");
  console.log("  Supplier:      supplier@vms.local");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
