import { SOWStatus } from "@prisma/client";
import { clsx } from "clsx";

const statusStyles: Record<SOWStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-amber-100 text-amber-800",
  OPS_APPROVED: "bg-blue-100 text-blue-800",
  SUPPLIER_ACCEPTED: "bg-emerald-100 text-emerald-800",
  SUPPLIER_REJECTED: "bg-red-100 text-red-800",
  PENDING_FINANCIAL_APPROVAL: "bg-violet-100 text-violet-800",
  FINANCIALLY_APPROVED: "bg-green-100 text-green-800",
  FINANCIALLY_REJECTED: "bg-red-100 text-red-800",
  ACTIVE: "bg-green-100 text-green-800",
};

export function SOWStatusBadge({ status }: { status: SOWStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        statusStyles[status] ?? "bg-gray-100 text-gray-700"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
