import { requireTenantUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewDealForm from "./new-deal-form";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ stageId?: string; customerId?: string }>;
}) {
  const user = await requireTenantUser();
  const { stageId, customerId } = await searchParams;

  const [stages, users] = await Promise.all([
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

  const preloadedCustomer = customerId
    ? await prisma.customer.findFirst({
        where: { id: customerId, tenantId: user.tenantId },
        select: { id: true, name: true, companyName: true },
      })
    : null;

  return (
    <div className="max-w-2xl">
      <NewDealForm
        stages={stages}
        users={users}
        defaultStageId={stageId ?? stages[0]?.id}
        currentUserId={user.id}
        preloadedCustomer={preloadedCustomer as any}
      />
    </div>
  );
}
