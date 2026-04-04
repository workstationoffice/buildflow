import { requireTenantUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@prisma/client";
import { Building2, MapPin, Plus } from "lucide-react";

export default async function SitesPage() {
  const user = await requireTenantUser();
  const canManage = await hasPermission(user.tenantId, user.role, Permission.MANAGE_SITES);

  const sites = await prisma.site.findMany({
    where: { tenantId: user.tenantId, isActive: true },
    include: { _count: { select: { visits: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Project Sites</h1>
        {canManage && (
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Site
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((site) => (
          <div key={site.id} className="bg-white rounded-xl border p-5 space-y-3">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">{site.name}</div>
                <div className="text-sm text-slate-500 mt-0.5">{site.address}</div>
              </div>
            </div>
            {site.latitude && site.longitude && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="w-3 h-3" />
                {site.latitude.toFixed(5)}, {site.longitude.toFixed(5)}
              </div>
            )}
            <div className="text-xs text-slate-400">{site._count.visits} visits</div>
          </div>
        ))}
      </div>
    </div>
  );
}
