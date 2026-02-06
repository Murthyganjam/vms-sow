"use client";

import { Role, SOWStatus } from "@prisma/client";
import { submitSOWAction } from "@/app/actions/workflow";
import { opsApproveAction } from "@/app/actions/workflow";
import { supplierAcceptAction, supplierRejectAction } from "@/app/actions/workflow";
import { financialApproveAction, financialRejectAction } from "@/app/actions/workflow";
import { useState } from "react";

type SOWPlain = {
  id: string;
  status: SOWStatus;
};

export function SOWWorkflowActions({
  sow,
  sessionRole,
  totalValue,
}: {
  sow: SOWPlain;
  sessionRole: Role;
  totalValue: number | null;
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      await submitSOWAction(sow.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleOpsApprove() {
    setLoading(true);
    setError("");
    try {
      await opsApproveAction(sow.id, comment || undefined);
      setComment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSupplierAccept() {
    setLoading(true);
    setError("");
    try {
      await supplierAcceptAction(sow.id, comment || undefined);
      setComment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSupplierReject() {
    setLoading(true);
    setError("");
    try {
      await supplierRejectAction(sow.id, comment || undefined);
      setComment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinancialApprove() {
    setLoading(true);
    setError("");
    try {
      await financialApproveAction(sow.id, comment || undefined);
      setComment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinancialReject() {
    setLoading(true);
    setError("");
    try {
      await financialRejectAction(sow.id, comment || undefined);
      setComment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {(sessionRole === "OPS_TEAM" && sow.status === "SUBMITTED") ||
      (sessionRole === "SUPPLIER" && sow.status === "OPS_APPROVED") ||
      (sessionRole === "APPROVER" && sow.status === "PENDING_FINANCIAL_APPROVAL") ? (
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <textarea
            placeholder="Comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            {sessionRole === "HIRING_MANAGER" && sow.status === "DRAFT" && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Submit SOW
              </button>
            )}
            {sessionRole === "OPS_TEAM" && sow.status === "SUBMITTED" && (
              <button
                onClick={handleOpsApprove}
                disabled={loading}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                OPS Approve
              </button>
            )}
            {sessionRole === "SUPPLIER" && sow.status === "OPS_APPROVED" && (
              <>
                <button
                  onClick={handleSupplierAccept}
                  disabled={loading}
                  className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={handleSupplierReject}
                  disabled={loading}
                  className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}
            {sessionRole === "APPROVER" && sow.status === "PENDING_FINANCIAL_APPROVAL" && (
              <>
                <button
                  onClick={handleFinancialApprove}
                  disabled={loading}
                  className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Financial Approve
                </button>
                <button
                  onClick={handleFinancialReject}
                  disabled={loading}
                  className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      ) : sessionRole === "HIRING_MANAGER" && sow.status === "DRAFT" ? (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Submit SOW
        </button>
      ) : null}
    </div>
  );
}
