import { requireTenantUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@prisma/client";
import { SettingsTabs } from "@/components/dashboard/settings-tabs";

export default async function SettingsPage() {
  const user = await requireTenantUser();

  const [canManagePerms, canManageStorage, canManageStages, canManageTenant] = await Promise.all([
    hasPermission(user.tenantId, user.role, Permission.MANAGE_PERMISSIONS),
    hasPermission(user.tenantId, user.role, Permission.MANAGE_STORAGE),
    hasPermission(user.tenantId, user.role, Permission.MANAGE_PIPELINE_STAGES),
    hasPermission(user.tenantId, user.role, Permission.MANAGE_TENANT),
  ]);

  const [storageConfig, stages, tenant] = await Promise.all([
    prisma.storageConfig.findUnique({ where: { tenantId: user.tenantId } }),
    prisma.pipelineStage.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { order: "asc" },
    }),
    prisma.tenant.findUnique({ where: { id: user.tenantId } }),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your company workspace</p>
      </div>
      <SettingsTabs
        canManagePerms={canManagePerms}
        canManageStorage={canManageStorage}
        canManageStages={canManageStages}
        canManageTenant={canManageTenant}
        storageConfig={storageConfig as any}
        stages={stages}
        tenant={{ name: tenant?.name ?? "", timezone: tenant?.timezone ?? "Asia/Bangkok" }}
      />
    </div>
  );
}
