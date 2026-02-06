import { describe, it, expect, vi, beforeEach } from "vitest";
import { SOWStatus } from "@prisma/client";
import * as workflow from "./workflow";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sOW: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    },
    sOWApproval: { upsert: vi.fn().mockResolvedValue(undefined), update: vi.fn().mockResolvedValue(undefined) },
    signatureAuthorityLimit: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((fns: unknown[]) =>
      Promise.all(
        (Array.isArray(fns) ? fns : [fns]).map((fn: () => unknown) =>
          typeof fn === "function" ? fn() : fn
        )
      )
    ),
  },
}));

const prisma = await import("@/lib/prisma").then((m) => m.prisma);

describe("workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitSOW", () => {
    it("throws when SOW is not DRAFT", async () => {
      vi.mocked(prisma.sOW.findUniqueOrThrow).mockResolvedValue({
        id: "sow-1",
        status: SOWStatus.SUBMITTED,
      } as never);
      await expect(workflow.submitSOW("sow-1", "user-1")).rejects.toThrow(
        "SOW must be in DRAFT to submit"
      );
    });

    it("updates SOW and creates OPS step when DRAFT", async () => {
      vi.mocked(prisma.sOW.findUniqueOrThrow).mockResolvedValue({
        id: "sow-1",
        status: SOWStatus.DRAFT,
      } as never);
      vi.mocked(prisma.$transaction).mockImplementation((fns) =>
        Promise.all(
          (Array.isArray(fns) ? fns : [fns]).map((fn: () => unknown) =>
            typeof fn === "function" ? fn() : fn
          )
        ) as Promise<unknown>
      );
      await workflow.submitSOW("sow-1", "hm-1");
      expect(prisma.sOW.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: "sow-1" } });
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("opsApprove", () => {
    it("throws when SOW is not SUBMITTED", async () => {
      vi.mocked(prisma.sOW.findUniqueOrThrow).mockResolvedValue({
        id: "sow-1",
        status: SOWStatus.DRAFT,
      } as never);
      await expect(workflow.opsApprove("sow-1", "ops-1")).rejects.toThrow(
        "SOW must be SUBMITTED for OPS approval"
      );
    });
  });

  describe("supplierAccept", () => {
    it("throws when SOW is not OPS_APPROVED", async () => {
      vi.mocked(prisma.sOW.findUniqueOrThrow).mockResolvedValue({
        id: "sow-1",
        status: SOWStatus.SUBMITTED,
      } as never);
      await expect(workflow.supplierAccept("sow-1", "sup-1")).rejects.toThrow(
        "SOW must be OPS_APPROVED for supplier to accept"
      );
    });
  });

  describe("financialApprove", () => {
    it("throws when SOW is not PENDING_FINANCIAL_APPROVAL", async () => {
      vi.mocked(prisma.sOW.findUniqueOrThrow).mockResolvedValue({
        id: "sow-1",
        status: SOWStatus.OPS_APPROVED,
        totalValue: 10000,
      } as never);
      await expect(workflow.financialApprove("sow-1", "app-1")).rejects.toThrow(
        "SOW must be PENDING_FINANCIAL_APPROVAL"
      );
    });

    it("throws when approver signature limit is below SOW value", async () => {
      vi.mocked(prisma.sOW.findUniqueOrThrow).mockResolvedValue({
        id: "sow-1",
        status: SOWStatus.PENDING_FINANCIAL_APPROVAL,
        totalValue: 100_000,
      } as never);
      vi.mocked(prisma.signatureAuthorityLimit.findUnique).mockResolvedValue({
        userId: "app-1",
        limitAmount: 50_000,
      } as never);
      await expect(workflow.financialApprove("sow-1", "app-1")).rejects.toThrow(
        "Your signature authority limit is below this SOW value"
      );
    });
  });

  describe("getEligibleFinancialApprovers", () => {
    it("returns approvers with limit >= SOW value", async () => {
      vi.mocked(prisma.signatureAuthorityLimit.findMany).mockResolvedValue([
        { user: { id: "u1", name: "A", email: "a@vms.local" } },
      ] as never);
      const result = await workflow.getEligibleFinancialApprovers(40_000 as never);
      expect(prisma.signatureAuthorityLimit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { limitAmount: { gte: 40_000 } },
        })
      );
      expect(result).toHaveLength(1);
    });

    it("returns empty when totalValue is null", async () => {
      const result = await workflow.getEligibleFinancialApprovers(null);
      expect(result).toEqual([]);
      expect(prisma.signatureAuthorityLimit.findMany).not.toHaveBeenCalled();
    });
  });
});
