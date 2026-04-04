"use client";

import { useState } from "react";
import { HardDrive, Kanban, Shield, Plus, Trash2, GripVertical, Building2, Globe, CheckCircle } from "lucide-react";

interface Stage { id: string; name: string; color: string; order: number; isActive: boolean }
interface StorageConfig { provider: string; sharepointSiteId?: string; onedriveFolder?: string; googleDriveFolderId?: string }
interface Tenant { name: string; timezone: string }

const TIMEZONES = [
  { value: "Asia/Bangkok",    label: "Asia/Bangkok (UTC+7) — Thailand, Vietnam, Indonesia (WIB)" },
  { value: "Asia/Singapore",  label: "Asia/Singapore (UTC+8) — Singapore, Malaysia, Philippines" },
  { value: "Asia/Tokyo",      label: "Asia/Tokyo (UTC+9) — Japan, Korea" },
  { value: "Asia/Kolkata",    label: "Asia/Kolkata (UTC+5:30) — India" },
  { value: "Asia/Dubai",      label: "Asia/Dubai (UTC+4) — UAE, Oman" },
  { value: "Europe/London",   label: "Europe/London (UTC+0/+1)" },
  { value: "Europe/Paris",    label: "Europe/Paris (UTC+1/+2)" },
  { value: "America/New_York", label: "America/New_York (UTC-5/-4)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8/-7)" },
  { value: "UTC",             label: "UTC (UTC+0)" },
];

export function SettingsTabs({
  canManagePerms,
  canManageStorage,
  canManageStages,
  canManageTenant,
  storageConfig,
  stages: initialStages,
  tenant: initialTenant,
}: {
  canManagePerms: boolean;
  canManageStorage: boolean;
  canManageStages: boolean;
  canManageTenant: boolean;
  storageConfig: StorageConfig | null;
  stages: Stage[];
  tenant: Tenant;
}) {
  type Tab = "company" | "storage" | "pipeline" | "permissions";
  const defaultTab: Tab = canManageTenant ? "company" : canManageStages ? "pipeline" : "storage";
  const [tab, setTab] = useState<Tab>(defaultTab);

  const [stages, setStages] = useState(initialStages);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#6366f1");
  const [storageProvider, setStorageProvider] = useState(storageConfig?.provider ?? "R2");
  const [storageSaving, setStorageSaving] = useState(false);
  const [stageSaving, setStageSaving] = useState(false);

  // Company settings
  const [companyName, setCompanyName] = useState(initialTenant.name);
  const [timezone, setTimezone] = useState(initialTenant.timezone);
  const [companySaving, setCompanySaving] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

  const saveCompany = async () => {
    setCompanySaving(true);
    await fetch("/api/settings/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: companyName, timezone }),
    });
    setCompanySaving(false);
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 3000);
  };

  const addStage = async () => {
    if (!newStageName.trim()) return;
    setStageSaving(true);
    const res = await fetch("/api/pipeline-stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newStageName, color: newStageColor, order: stages.length }),
    });
    const data = await res.json();
    if (res.ok) { setStages([...stages, data.stage]); setNewStageName(""); }
    setStageSaving(false);
  };

  const saveStorage = async () => {
    setStorageSaving(true);
    await fetch("/api/settings/storage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: storageProvider }),
    });
    setStorageSaving(false);
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType; show: boolean }[] = [
    { key: "company",     label: "Company",        icon: Building2, show: canManageTenant },
    { key: "pipeline",    label: "Pipeline Stages", icon: Kanban,    show: canManageStages },
    { key: "storage",     label: "Storage",         icon: HardDrive, show: canManageStorage },
    { key: "permissions", label: "Permissions",     icon: Shield,    show: canManagePerms },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50">
        {tabs.filter((t) => t.show).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-violet-600 text-violet-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Company Settings */}
        {tab === "company" && canManageTenant && (
          <div className="space-y-5 max-w-lg">
            <p className="text-sm text-slate-500">Configure your company workspace settings.</p>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" /> Company Name
              </label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-500" /> Timezone
              </label>
              <p className="text-xs text-slate-400">All dates and times in the app are displayed in this timezone.</p>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
              <div className="mt-1 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                Current time in <strong>{timezone}</strong>:{" "}
                {new Intl.DateTimeFormat("en-GB", { timeZone: timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date())}
              </div>
            </div>

            <button
              onClick={saveCompany}
              disabled={companySaving}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 transition-all shadow-sm"
            >
              {companySaved ? (
                <><CheckCircle className="w-4 h-4" /> Saved!</>
              ) : companySaving ? "Saving..." : "Save Company Settings"}
            </button>
          </div>
        )}

        {/* Pipeline Stages */}
        {tab === "pipeline" && canManageStages && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Customize deal pipeline stages.</p>
            <div className="space-y-2">
              {stages.map((stage) => (
                <div key={stage.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                  <div className="w-4 h-4 rounded-full shrink-0 border border-white shadow-sm" style={{ background: stage.color }} />
                  <span className="flex-1 text-sm font-medium text-slate-700">{stage.name}</span>
                  <button className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <input type="color" value={newStageColor} onChange={(e) => setNewStageColor(e.target.value)}
                className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer p-0.5" />
              <input type="text" value={newStageName} onChange={(e) => setNewStageName(e.target.value)}
                placeholder="New stage name..."
                className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && addStage()} />
              <button onClick={addStage} disabled={stageSaving || !newStageName.trim()}
                className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 shadow-sm">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>
        )}

        {/* Storage */}
        {tab === "storage" && canManageStorage && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Choose where deal attachments are stored.</p>
            <div className="space-y-2">
              {[
                { value: "R2",           label: "ConstructFlow Storage (Cloudflare R2)", desc: "Default — files stored on our servers" },
                { value: "SHAREPOINT",   label: "Microsoft SharePoint",                  desc: "Store files in your SharePoint site" },
                { value: "ONEDRIVE",     label: "Microsoft OneDrive",                    desc: "Store files in your OneDrive" },
                { value: "GOOGLE_DRIVE", label: "Google Drive",                          desc: "Store files in your Google Drive" },
              ].map((opt) => (
                <label key={opt.value} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${storageProvider === opt.value ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <input type="radio" name="storage" value={opt.value} checked={storageProvider === opt.value}
                    onChange={() => setStorageProvider(opt.value)} className="mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{opt.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <button onClick={saveStorage} disabled={storageSaving}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 shadow-sm">
              {storageSaving ? "Saving..." : "Save Storage Settings"}
            </button>
          </div>
        )}

        {/* Permissions */}
        {tab === "permissions" && canManagePerms && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Manage role-based access permissions. Changes apply immediately.</p>
            <PermissionsMatrix />
          </div>
        )}
      </div>
    </div>
  );
}

function PermissionsMatrix() {
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>> | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    fetch("/api/permissions")
      .then((r) => r.json())
      .then((data) => { setMatrix(data.matrix); setPermissions(data.allPermissions); setLoading(false); });
  });

  const toggle = async (role: string, permission: string, current: boolean) => {
    setMatrix((prev) => prev ? { ...prev, [role]: { ...prev[role], [permission]: !current } } : prev);
    await fetch("/api/permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, permission, granted: !current }),
    });
  };

  if (loading || !matrix) return <div className="text-sm text-slate-400">Loading permissions...</div>;
  const roles = Object.keys(matrix);

  return (
    <div className="overflow-x-auto">
      <table className="text-xs w-full">
        <thead>
          <tr>
            <th className="text-left py-2 pr-4 font-semibold text-slate-600 sticky left-0 bg-white">Permission</th>
            {roles.map((role) => (
              <th key={role} className="px-2 py-2 font-semibold text-slate-600 text-center whitespace-nowrap">
                {role.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {permissions.map((perm) => (
            <tr key={perm} className="hover:bg-slate-50">
              <td className="py-2 pr-4 text-slate-700 sticky left-0 bg-white whitespace-nowrap">
                {perm.replace(/_/g, " ").toLowerCase()}
              </td>
              {roles.map((role) => (
                <td key={role} className="px-2 py-2 text-center">
                  <input type="checkbox" checked={matrix[role][perm] ?? false}
                    onChange={() => toggle(role, perm, matrix[role][perm])}
                    className="rounded accent-violet-600" disabled={role === "COMPANY_ADMIN"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
