import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CreateSOWForm } from "@/components/create-sow-form";

export default async function NewSOWPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "HIRING_MANAGER") redirect("/dashboard");

  const vendors = await prisma.vendor.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">New Statement of Work</h1>
      <CreateSOWForm vendors={vendors} userId={session.user.id} />
    </div>
  );
}
