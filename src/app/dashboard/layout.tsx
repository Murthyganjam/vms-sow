import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const roleLabel =
    session.user.role === "HIRING_MANAGER"
      ? "Hiring Manager"
      : session.user.role === "OPS_TEAM"
        ? "OPS Team"
        : session.user.role === "APPROVER"
          ? "Approver"
          : "Supplier";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold text-gray-900">
            VMS SOW
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              SOWs
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {session.user.email} <span className="text-gray-400">({roleLabel})</span>
          </span>
          <form action={signOutAction}>
            <button type="submit" className="text-sm text-blue-600 hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
