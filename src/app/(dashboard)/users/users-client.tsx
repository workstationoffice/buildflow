"use client";

import { useState } from "react";
import { User, Plus, CheckCircle, Clock } from "lucide-react";
import InviteUserModal from "@/components/users/invite-user-modal";

const roleLabels: Record<string, string> = {
  COMPANY_ADMIN:     "Company Admin",
  SALES_MANAGER:     "Sales Manager",
  SALES_SUPERVISOR:  "Sales Supervisor",
  SALES_EXECUTIVE:   "Sales Executive",
  DESIGN_MANAGER:    "Design Manager",
  DESIGN_SUPERVISOR: "Design Supervisor",
  DESIGN_OFFICER:    "Design Officer",
  FOREMAN_MANAGER:   "Foreman Manager",
  FOREMAN_SUPERVISOR:"Foreman Supervisor",
  FOREMAN:           "Foreman",
};

const deptPill: Record<string, string> = {
  MANAGEMENT: "bg-purple-100 text-purple-700",
  SALES:      "bg-blue-100 text-blue-700",
  DESIGN:     "bg-emerald-100 text-emerald-700",
  OPERATIONS: "bg-orange-100 text-orange-700",
};

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatarUrl: string | null;
  isActive: boolean;
  phone: string | null;
  clerkId: string;
}

interface Props {
  users: UserRow[];
  canManage: boolean;
}

export default function UsersClient({ users: initial, canManage }: Props) {
  const [users, setUsers] = useState(initial);
  const [showInvite, setShowInvite] = useState(false);

  const handleInviteSuccess = () => {
    // Reload users list
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => { if (d.users) setUsers(d.users); })
      .catch(() => {});
  };

  const pendingUsers = users.filter((u) => u.clerkId.startsWith("pending_"));
  const activeUsers  = users.filter((u) => !u.clerkId.startsWith("pending_"));

  return (
    <>
      {showInvite && (
        <InviteUserModal
          onClose={() => setShowInvite(false)}
          onSuccess={handleInviteSuccess}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Users</h1>
            <p className="text-slate-500 text-sm mt-0.5">{activeUsers.length} active · {pendingUsers.length} pending</p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" /> Invite User
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {activeUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    u.name[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{u.name}</div>
                  <div className="text-sm text-slate-500 truncate">{u.email}</div>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${deptPill[u.department] ?? "bg-slate-100 text-slate-600"}`}>
                  {u.department.toLowerCase()}
                </span>
                <span className="text-xs text-slate-500 hidden md:block">{roleLabels[u.role] ?? u.role}</span>
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {pendingUsers.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-slate-700">Pending Invitations</span>
            </div>
            <div className="divide-y divide-slate-50">
              {pendingUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-700 truncate">{u.name}</div>
                    <div className="text-sm text-slate-400 truncate">{u.email}</div>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${deptPill[u.department] ?? "bg-slate-100 text-slate-600"}`}>
                    {u.department.toLowerCase()}
                  </span>
                  <span className="text-xs text-slate-400 hidden md:block">{roleLabels[u.role] ?? u.role}</span>
                  <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium shrink-0">Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
