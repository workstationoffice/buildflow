"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatCurrency, isDealAlert, getDealAlerts } from "@/lib/utils";
import { AlertCircle, Plus, User } from "lucide-react";
import Link from "next/link";

interface Deal {
  id: string;
  title: string;
  value: number;
  stageId: string;
  nextContactDate?: Date | string | null;
  estimatedCloseDate?: Date | string | null;
  customer: { id: string; name: string; companyName?: string | null; type: string };
  assignees: { user: { id: string; name: string; avatarUrl?: string | null } }[];
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
}

function DealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const alert = isDealAlert(deal);
  const alerts = getDealAlerts(deal);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-sm ${
        alert ? "border-red-400 bg-red-50" : "border-slate-200"
      }`}
    >
      {alert && (
        <div className="flex items-start gap-1.5 mb-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-xs text-red-600 space-y-0.5">
            {alerts.map((a) => <div key={a}>{a}</div>)}
          </div>
        </div>
      )}

      <Link href={`/deals/${deal.id}`} className="block" onClick={(e) => e.stopPropagation()}>
        <div className="font-medium text-slate-900 text-sm line-clamp-2">{deal.title}</div>
        <div className="text-xs text-slate-500 mt-1 truncate">
          {deal.customer.companyName ?? deal.customer.name}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">{formatCurrency(deal.value)}</span>
          <div className="flex -space-x-1">
            {deal.assignees.slice(0, 3).map(({ user }) => (
              <div
                key={user.id}
                className="w-5 h-5 rounded-full bg-slate-300 border border-white flex items-center justify-center text-xs font-medium text-slate-600"
                title={user.name}
              >
                {user.name[0]}
              </div>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
}

function KanbanColumn({ stage, deals }: { stage: Stage; deals: Deal[] }) {
  const total = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col w-72 shrink-0 bg-slate-50 rounded-xl border">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
          <span className="font-medium text-slate-800 text-sm">{stage.name}</span>
          <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5">{deals.length}</span>
        </div>
        <span className="text-xs text-slate-500">{formatCurrency(total)}</span>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[200px]">
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>
      </div>
      <div className="p-2 border-t">
        <Link
          href={`/deals/new?stageId=${stage.id}`}
          className="flex items-center gap-1.5 w-full text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded hover:bg-slate-100"
        >
          <Plus className="w-3.5 h-3.5" /> Add deal
        </Link>
      </div>
    </div>
  );
}

export function KanbanBoard({ stages, initialDeals }: { stages: Stage[]; initialDeals: Deal[] }) {
  const [deals, setDeals] = useState(initialDeals);
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const draggedDeal = deals.find((d) => d.id === active.id);
    if (!draggedDeal) return;

    // Determine target stage
    let targetStageId = stages.find((s) => s.id === over.id)?.id;
    if (!targetStageId) {
      targetStageId = deals.find((d) => d.id === over.id)?.stageId;
    }

    if (!targetStageId || targetStageId === draggedDeal.stageId) return;

    setDeals((prev) =>
      prev.map((d) => (d.id === active.id ? { ...d, stageId: targetStageId! } : d))
    );

    await fetch(`/api/deals/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId: targetStageId }),
    });
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd} onDragStart={(e) => setActiveId(String(e.active.id))}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={deals.filter((d) => d.stageId === stage.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}
