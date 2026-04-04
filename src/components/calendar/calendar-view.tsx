"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, addYears, subYears } from "date-fns";
import { ChevronLeft, ChevronRight, MapPin, Briefcase, Calendar } from "lucide-react";
import { isDealAlert } from "@/lib/utils";
import Link from "next/link";

type ViewType = "year" | "month" | "day";
type FilterStatus = string | "all";

interface CalendarEvent {
  id: string;
  type: "visit" | "plan" | "deal";
  date: Date;
  title: string;
  status?: string;
  color?: string;
  href?: string;
  isAlert?: boolean;
}

function buildEvents(plans: any[], visits: any[], deals: any[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  plans.forEach((p) =>
    events.push({
      id: `plan-${p.id}`,
      type: "plan",
      date: new Date(p.plannedDate),
      title: p.title,
      status: "PLANNED",
      color: "bg-blue-500",
    })
  );

  visits.forEach((v) =>
    events.push({
      id: `visit-${v.id}`,
      type: "visit",
      date: new Date(v.checkInAt ?? v.createdAt),
      title: v.site?.name ?? v.checkInAddress ?? "Visit",
      status: v.status,
      color: v.status === "CHECKED_IN" ? "bg-green-500" : v.status === "CHECKED_OUT" ? "bg-slate-400" : "bg-blue-400",
    })
  );

  deals.forEach((d) =>
    d.nextContactDate &&
    events.push({
      id: `deal-${d.id}`,
      type: "deal",
      date: new Date(d.nextContactDate),
      title: d.title,
      status: d.stage?.name,
      color: isDealAlert(d) ? "bg-red-500" : "bg-purple-500",
      href: `/deals/${d.id}`,
      isAlert: isDealAlert(d),
    })
  );

  return events;
}

export function CalendarView({
  initialPlans, initialVisits, initialDeals, userId,
}: {
  initialPlans: any[];
  initialVisits: any[];
  initialDeals: any[];
  userId: string;
}) {
  const [view, setView] = useState<ViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showVisits, setShowVisits] = useState(true);
  const [showDeals, setShowDeals] = useState(true);
  const [visitStatusFilter, setVisitStatusFilter] = useState<FilterStatus>("all");
  const [dealStatusFilter, setDealStatusFilter] = useState<FilterStatus>("all");

  const allEvents = useMemo(
    () => buildEvents(initialPlans, initialVisits, initialDeals),
    [initialPlans, initialVisits, initialDeals]
  );

  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      if (e.type === "deal" && !showDeals) return false;
      if ((e.type === "visit" || e.type === "plan") && !showVisits) return false;
      if (e.type === "visit" && visitStatusFilter !== "all" && e.status !== visitStatusFilter) return false;
      if (e.type === "deal" && dealStatusFilter !== "all" && e.status !== dealStatusFilter) return false;
      return true;
    });
  }, [allEvents, showVisits, showDeals, visitStatusFilter, dealStatusFilter]);

  const getEventsForDay = (day: Date) =>
    filteredEvents.filter((e) => isSameDay(e.date, day));

  const navigate = (dir: 1 | -1) => {
    if (view === "year") setCurrentDate(dir === 1 ? addYears(currentDate, 1) : subYears(currentDate, 1));
    else if (view === "month") setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + dir)));
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border p-4">
        {/* View switcher */}
        <div className="flex rounded-lg border overflow-hidden text-sm">
          {(["year", "month", "day"] as ViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 capitalize ${view === v ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-slate-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-32 text-center">
            {view === "year" && format(currentDate, "yyyy")}
            {view === "month" && format(currentDate, "MMMM yyyy")}
            {view === "day" && format(currentDate, "d MMMM yyyy")}
          </span>
          <button onClick={() => navigate(1)} className="p-1.5 rounded hover:bg-slate-100">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full border-t pt-3 mt-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showVisits} onChange={(e) => setShowVisits(e.target.checked)} className="rounded" />
            <MapPin className="w-3.5 h-3.5 text-blue-500" /> Visits
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showDeals} onChange={(e) => setShowDeals(e.target.checked)} className="rounded" />
            <Briefcase className="w-3.5 h-3.5 text-purple-500" /> Deals
          </label>
          {showVisits && (
            <select
              value={visitStatusFilter}
              onChange={(e) => setVisitStatusFilter(e.target.value)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="all">All visit statuses</option>
              <option value="PLANNED">Planned</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
            </select>
          )}
          {showDeals && (
            <select
              value={dealStatusFilter}
              onChange={(e) => setDealStatusFilter(e.target.value)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="all">All deal stages</option>
            </select>
          )}
        </div>
      </div>

      {/* Month view */}
      {view === "month" && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-500 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {/* Empty cells for first week */}
            {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="border-r border-b min-h-[100px] bg-slate-50" />
            ))}
            {daysInMonth.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className="border-r border-b min-h-[100px] p-1 cursor-pointer hover:bg-slate-50"
                  onClick={() => { setCurrentDate(day); setView("day"); }}
                >
                  <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                    isToday ? "bg-blue-600 text-white" : "text-slate-700"
                  }`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div key={e.id} className={`text-xs px-1 py-0.5 rounded truncate text-white ${e.color}`}>
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-400 pl-1">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day view */}
      {view === "day" && (
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-semibold text-slate-900">{format(currentDate, "EEEE, d MMMM yyyy")}</h2>
          {getEventsForDay(currentDate).length === 0 ? (
            <p className="text-slate-400 text-sm">No events for this day</p>
          ) : (
            <div className="space-y-2">
              {getEventsForDay(currentDate).map((e) => (
                <div key={e.id} className={`flex items-start gap-3 p-3 rounded-lg border ${e.isAlert ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${e.color}`} />
                  <div>
                    <div className="font-medium text-sm text-slate-900">{e.title}</div>
                    <div className="text-xs text-slate-500 capitalize">{e.type} • {e.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Year view — heatmap */}
      {view === "year" && (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, monthIdx) => {
            const monthDate = new Date(currentDate.getFullYear(), monthIdx, 1);
            const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
            return (
              <div key={monthIdx} className="bg-white rounded-xl border p-3">
                <div className="text-sm font-medium text-slate-700 mb-2">{format(monthDate, "MMMM")}</div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: days[0].getDay() }).map((_, i) => (
                    <div key={`e-${i}`} />
                  ))}
                  {days.map((day) => {
                    const count = getEventsForDay(day).length;
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => { setCurrentDate(day); setView("day"); }}
                        className={`w-full aspect-square rounded-sm cursor-pointer ${
                          count === 0 ? "bg-slate-100"
                          : count === 1 ? "bg-blue-200"
                          : count === 2 ? "bg-blue-400"
                          : "bg-blue-600"
                        }`}
                        title={`${format(day, "d MMM")}: ${count} events`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
