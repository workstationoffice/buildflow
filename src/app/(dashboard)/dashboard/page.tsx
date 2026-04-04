import { requireTenantUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Permission, VisitStatus } from "@prisma/client";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { MapPin, UserCheck, Kanban, TrendingUp, Clock, ArrowUpRight } from "lucide-react";

const roleLabel = (role: string) =>
  role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const deptPill: Record<string, string> = {
  SALES:      "bg-blue-100 text-blue-700",
  DESIGN:     "bg-violet-100 text-violet-700",
  OPERATIONS: "bg-orange-100 text-orange-700",
  MANAGEMENT: "bg-rose-100 text-rose-700",
};

export default async function DashboardPage() {
  const user = await requireTenantUser();
  const canViewDashboard = await hasPermission(user.tenantId, user.role, Permission.VIEW_DASHBOARD);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [liveVisits, todayVisits, openDeals, pipelineAgg] = await Promise.all([
    prisma.visit.findMany({
      where: { tenantId: user.tenantId, status: VisitStatus.CHECKED_IN },
      include: { user: { select: { name: true, role: true, department: true } }, site: true },
      orderBy: { checkInAt: "desc" },
      take: canViewDashboard ? undefined : 0,
    }),
    prisma.visit.count({ where: { tenantId: user.tenantId, checkInAt: { gte: today, lt: tomorrow } } }),
    prisma.deal.count({ where: { tenantId: user.tenantId, isActive: true } }),
    prisma.deal.aggregate({ where: { tenantId: user.tenantId, isActive: true }, _sum: { value: true } }),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const stats = [
    {
      label: "Live On Site",
      value: liveVisits.length,
      sub: "right now",
      icon: MapPin,
      iconBg: "bg-emerald-500",
      cardBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      light: true,
    },
    {
      label: "Visits Today",
      value: todayVisits,
      sub: "since midnight",
      icon: UserCheck,
      iconBg: "bg-blue-500",
      cardBg: "bg-white",
      light: false,
    },
    {
      label: "Open Deals",
      value: openDeals,
      sub: "active pipeline",
      icon: Kanban,
      iconBg: "bg-violet-500",
      cardBg: "bg-white",
      light: false,
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(pipelineAgg._sum.value ?? 0),
      sub: "total value",
      icon: TrendingUp,
      iconBg: "bg-orange-500",
      cardBg: "bg-gradient-to-br from-orange-500 to-amber-500",
      light: true,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{greeting}, {user.name.split(" ")[0]} 👋</h1>
        <p className="text-slate-500 text-sm mt-0.5">Here's what's happening at your company today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, iconBg, cardBg, light }) => (
          <div key={label} className={`rounded-2xl p-5 shadow-sm border border-slate-200 ${cardBg}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${light ? "bg-white/25" : iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${light ? "text-white" : "text-white"}`} />
              </div>
              <ArrowUpRight className={`w-4 h-4 ${light ? "text-white/60" : "text-slate-300"}`} />
            </div>
            <div className={`text-2xl font-bold ${light ? "text-white" : "text-slate-900"}`}>{value}</div>
            <div className={`text-sm font-medium mt-0.5 ${light ? "text-white/80" : "text-slate-600"}`}>{label}</div>
            <div className={`text-xs mt-0.5 ${light ? "text-white/60" : "text-slate-400"}`}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Live check-ins table */}
      {canViewDashboard && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-semibold text-slate-900">Currently On Site</h2>
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full">
              {liveVisits.length} active
            </span>
          </div>

          {liveVisits.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm font-medium">No one is currently on site</p>
              <p className="text-slate-400 text-xs mt-1">Check-ins will appear here in real time</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {liveVisits.map((visit) => (
                <div key={visit.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {visit.user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">{visit.user.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-500 truncate">
                        {visit.site?.name ?? visit.checkInAddress ?? "Unknown location"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${deptPill[visit.user.department] ?? "bg-slate-100 text-slate-600"}`}>
                      {roleLabel(visit.user.role)}
                    </span>
                    {visit.checkInAt && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(visit.checkInAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
