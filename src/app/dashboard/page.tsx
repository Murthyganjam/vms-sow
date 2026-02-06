import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SOWStatusBadge } from "@/components/sow-status-badge";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const sows = await prisma.sOW.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      vendor: true,
      submittedBy: { select: { name: true, email: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Statement of Work</h1>
        {session.user.role === "HIRING_MANAGER" && (
          <Link
            href="/dashboard/sows/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New SOW
          </Link>
        )}
      </div>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Vendor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Submitted by</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Value</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No SOWs yet. Run db:seed to add a sample, or create one as Hiring Manager.
                </td>
              </tr>
            ) : (
              sows.map((sow) => (
                <tr key={sow.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{sow.title}</td>
                  <td className="px-4 py-3 text-gray-600">{sow.templateType}</td>
                  <td className="px-4 py-3">
                    <SOWStatusBadge status={sow.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{sow.vendor?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {sow.submittedBy?.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {sow.totalValue != null ? `$${Number(sow.totalValue).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/sows/${sow.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
