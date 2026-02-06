import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { SOWStatusBadge } from "@/components/sow-status-badge";
import { SOWWorkflowActions } from "@/components/sow-workflow-actions";

export default async function SOWDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const sow = await prisma.sOW.findUnique({
    where: { id },
    include: {
      vendor: true,
      submittedBy: { select: { name: true, email: true } },
      milestones: { orderBy: { order: "asc" } },
      approvals: {
        orderBy: { step: "asc" },
        include: {
          opsApprover: { select: { name: true, email: true } },
          supplierUser: { select: { name: true, email: true } },
          financialApprover: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!sow) notFound();

  const totalValue = sow.totalValue != null ? Number(sow.totalValue) : null;
  // Pass only plain props to client component (no Prisma Decimal/Dates)
  const sowPlain = { id: sow.id, status: sow.status };

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
        ← Back to SOWs
      </Link>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{sow.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {sow.templateType} · <SOWStatusBadge status={sow.status} />
          </p>
        </div>
        <SOWWorkflowActions sow={sowPlain} sessionRole={session.user.role} totalValue={totalValue} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        {sow.description && (
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-1">Description</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{sow.description}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Vendor</span>
            <p className="font-medium">{sow.vendor?.name ?? "—"}</p>
          </div>
          <div>
            <span className="text-gray-500">Language</span>
            <p className="font-medium">
              {sow.language === "en" ? "English" : sow.language === "es" ? "Spanish" : sow.language === "fr" ? "French" : sow.language === "de" ? "German" : sow.language ?? "—"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Submitted by</span>
            <p className="font-medium">{sow.submittedBy?.email ?? "—"}</p>
          </div>
          <div>
            <span className="text-gray-500">Total value</span>
            <p className="font-medium">
              {totalValue != null ? `$${totalValue.toLocaleString()}` : "—"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Payment terms</span>
            <p className="font-medium">{sow.paymentTerms ?? "—"}</p>
          </div>
          <div>
            <span className="text-gray-500">Period of performance</span>
            <p className="font-medium">
              {sow.effectiveDate
                ? `${sow.effectiveDate.toLocaleDateString()} – ${sow.endDate?.toLocaleDateString() ?? "—"}`
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Cost center</span>
            <p className="font-medium">{sow.costCenter ?? "—"}</p>
          </div>
          <div>
            <span className="text-gray-500">Location</span>
            <p className="font-medium">{sow.location ?? "—"}</p>
          </div>
          <div>
            <span className="text-gray-500">Client POC</span>
            <p className="font-medium">
              {sow.clientPocName ?? "—"}
              {sow.clientPocEmail ? ` (${sow.clientPocEmail})` : ""}
            </p>
          </div>
          {sow.milestones.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-500 block mb-2">Milestones (for invoicing)</span>
              <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Milestone</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700">Amount (USD)</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Due date</th>
                    <th className="text-center px-3 py-2 font-medium text-gray-700">Recurring</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Acceptance method</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Acceptance criteria</th>
                  </tr>
                </thead>
                <tbody>
                  {sow.milestones.map((m) => (
                    <tr key={m.id} className="border-t border-gray-100">
                      <td className="px-3 py-2">{m.title}</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(m.amount))}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {m.recurring ? <span className="text-xs font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Recurring</span> : "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{m.acceptanceMethod ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-xs">{m.acceptanceCriteria ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {sow.outOfScope && (
            <div className="col-span-2">
              <span className="text-gray-500">Out of scope</span>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mt-0.5">{sow.outOfScope}</p>
            </div>
          )}
          {sow.assumptions && (
            <div className="col-span-2">
              <span className="text-gray-500">Assumptions</span>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mt-0.5">{sow.assumptions}</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Approval history</h2>
        <ul className="space-y-3">
          {sow.approvals.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0"
            >
              <span className="text-gray-600">{a.step.replace(/_/g, " ")}</span>
              <span
                className={
                  a.status === "APPROVED"
                    ? "text-green-600"
                    : a.status === "REJECTED"
                      ? "text-red-600"
                      : "text-amber-600"
                }
              >
                {a.status}
              </span>
              {a.actedAt && (
                <span className="text-gray-400">
                  {a.actedAt.toLocaleString()} by{" "}
                  {a.opsApprover?.email ?? a.supplierUser?.email ?? a.financialApprover?.email ?? "—"}
                </span>
              )}
              {a.comment && <span className="text-gray-500 italic">— {a.comment}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
