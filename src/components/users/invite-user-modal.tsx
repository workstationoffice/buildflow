"use client";

import { useState } from "react";
import { X, Mail, User, ChevronDown, Send } from "lucide-react";

const ROLES = [
  { value: "SALES_MANAGER",      label: "Sales Manager",      dept: "SALES" },
  { value: "SALES_SUPERVISOR",   label: "Sales Supervisor",   dept: "SALES" },
  { value: "SALES_EXECUTIVE",    label: "Sales Executive",    dept: "SALES" },
  { value: "DESIGN_MANAGER",     label: "Design Manager",     dept: "DESIGN" },
  { value: "DESIGN_SUPERVISOR",  label: "Design Supervisor",  dept: "DESIGN" },
  { value: "DESIGN_OFFICER",     label: "Design Officer",     dept: "DESIGN" },
  { value: "FOREMAN_MANAGER",    label: "Foreman Manager",    dept: "OPERATIONS" },
  { value: "FOREMAN_SUPERVISOR", label: "Foreman Supervisor", dept: "OPERATIONS" },
  { value: "FOREMAN",            label: "Foreman",            dept: "OPERATIONS" },
];

const deptColor: Record<string, string> = {
  SALES: "text-blue-600 bg-blue-50",
  DESIGN: "text-violet-600 bg-violet-50",
  OPERATIONS: "text-orange-600 bg-orange-50",
};

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteUserModal({ onClose, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName]   = useState("");
  const [role, setRole]   = useState("SALES_EXECUTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send invite");
      setSent(true);
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find((r) => r.value === role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 flex items-start justify-between">
          <div>
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-2">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Invite Team Member</h2>
            <p className="text-white/65 text-sm">They&apos;ll receive an email to sign up</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {sent ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                <Send className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="font-semibold text-slate-900">Invitation sent!</p>
              <p className="text-sm text-slate-500">An email has been sent to <strong>{email}</strong></p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Somchai Jaidee"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="e.g. somchai@company.com"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Role</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors appearance-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    {selectedRole && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${deptColor[selectedRole.dept] ?? ""}`}>
                        {selectedRole.dept.toLowerCase()}
                      </span>
                    )}
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !name || !email}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 transition-all shadow-lg shadow-violet-100">
                  {loading ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
