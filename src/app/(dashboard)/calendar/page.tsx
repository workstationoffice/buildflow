import { requireTenantUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/calendar/calendar-view";
import { VisitStatus } from "@prisma/client";

export default async function CalendarPage() {
  const user = await requireTenantUser();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [plans, visits, deals] = await Promise.all([
    prisma.calendarPlan.findMany({
      where: {
        userId: user.id,
        plannedDate: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { deal: true },
    }),
    prisma.visit.findMany({
      where: {
        userId: user.id,
        checkInAt: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { site: true, deal: true },
    }),
    prisma.deal.findMany({
      where: {
        tenantId: user.tenantId,
        isActive: true,
        assignees: { some: { userId: user.id } },
        nextContactDate: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { customer: { select: { id: true, name: true } }, stage: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
      <CalendarView
        initialPlans={plans as any}
        initialVisits={visits as any}
        initialDeals={deals as any}
        userId={user.id}
      />
    </div>
  );
}
