import { requireTenantUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VisitStatus } from "@prisma/client";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { MapPin, LogIn, LogOut, Clock, Calendar, Plus } from "lucide-react";

const statusConfig: Record<VisitStatus, { label: string; color: string; dot: string }> = {
  PLANNED:     { label: "Planned",     color: "bg-blue-100 text-blue-700",     dot: "bg-blue-400" },
  CHECKED_IN:  { label: "On Site",     color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  CHECKED_OUT: { label: "Completed",   color: "bg-slate-100 text-slate-500",   dot: "bg-slate-400" },
};

export default async function VisitsPage() {
  const user = await requireTenantUser();

  const activeVisit = await prisma.visit.findFirst({
    where: { userId: user.id, status: VisitStatus.CHECKED_IN },
  });

  const visits = await prisma.visit.findMany({
    where: { userId: user.id },
    include: { site: true, deal: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Visits</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track your on-site presence</p>
        </div>
        <div className="flex gap-2">
          {activeVisit ? (
            <Link
              href={`/visits/check-out?visitId=${activeVisit.id}`}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition"
            >
              <LogOut className="w-4 h-4" /> Check Out
            </Link>
          ) : (
            <Link
              href="/visits/check-in"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition"
            >
              <LogIn className="w-4 h-4" /> Check In
            </Link>
          )}
        </div>
      </div>

      {/* Active visit banner */}
      {activeVisit && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <p className="text-emerald-800 text-sm font-medium flex-1">You are currently checked in. Remember to check out when you leave.</p>
          <Link
            href={`/visits/check-out?visitId=${activeVisit.id}`}
            className="text-xs font-semibold text-emerald-700 hover:underline shrink-0"
          >
            Check out →
          </Link>
        </div>
      )}

      {/* Visits list */}
      {visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <MapPin className="w-7 h-7 text-white" />
          </div>
          <p className="text-slate-700 font-semibold">No visits yet</p>
          <p className="text-slate-400 text-sm mt-1">Check in when you arrive on site</p>
          <Link
            href="/visits/check-in"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold mt-4 shadow-sm hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> Start first check-in
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => {
            const cfg = statusConfig[visit.status];
            const duration = visit.checkInAt && visit.checkOutAt
              ? Math.round((new Date(visit.checkOutAt).getTime() - new Date(visit.checkInAt).getTime()) / 60000)
              : null;

            return (
              <div key={visit.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-start gap-4 hover:shadow-md transition-shadow">
                {/* Status dot */}
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${cfg.dot} ${visit.status === "CHECKED_IN" ? "animate-pulse" : ""}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${cfg.color}`}>
                      {visit.isUnplanned ? "Unplanned · " : ""}{cfg.label}
                    </span>
                    {visit.deal && (
                      <span className="text-xs text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full font-medium">
                        {visit.deal.title}
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-slate-900 truncate">
                    {visit.site?.name ?? visit.checkInAddress ?? "Unknown location"}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    {visit.checkInAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDateTime(visit.checkInAt)}
                      </span>
                    )}
                    {duration !== null && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {duration} min
                      </span>
                    )}
                  </div>
                  {visit.jobSummary && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2 bg-slate-50 rounded-lg px-3 py-2">
                      {visit.jobSummary}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
