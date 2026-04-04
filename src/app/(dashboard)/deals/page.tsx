import { requireTenantUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/deals/kanban-board";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function DealsPage() {
  const user = await requireTenantUser();

  const [stages, deals] = await Promise.all([
    prisma.pipelineStage.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { order: "asc" },
    }),
    prisma.deal.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      include: {
        customer: { select: { id: true, name: true, companyName: true, type: true } },
        stage: true,
        assignees: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
      orderBy: [{ value: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deals</h1>
          <p className="text-slate-500 text-sm mt-0.5">{deals.length} active deals</p>
        </div>
        <Link
          href="/deals/new"
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> New Deal
        </Link>
      </div>
      <KanbanBoard stages={stages} initialDeals={deals} />
    </div>
  );
}
