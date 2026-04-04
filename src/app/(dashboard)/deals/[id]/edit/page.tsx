import { requireTenantUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditDealForm from "./edit-deal-form";

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireTenantUser();
  const { id } = await params;

  const [deal, stages, users] = await Promise.all([
    prisma.deal.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        customer: { select: { id: true, name: true, companyName: true } },
        assignees: { include: { user: { select: { id: true, name: true } } } },
      },
    }),
    prisma.pipelineStage.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { order: "asc" },
    }),
    prisma.user.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      select: { id: true, name: true, role: true, department: true },
      orderBy: [{ department: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!deal) notFound();

  return (
    <div className="max-w-2xl">
      <EditDealForm deal={deal as any} stages={stages} users={users} />
    </div>
  );
}
