import { prisma } from "./prisma";
import { Permission, RoleType } from "@prisma/client";

// Default permissions per role
export const DEFAULT_PERMISSIONS: Record<RoleType, Permission[]> = {
  COMPANY_ADMIN: Object.values(Permission),
  SALES_MANAGER: [
    Permission.VIEW_OWN_VISITS,
    Permission.VIEW_TEAM_VISITS,
    Permission.VIEW_DEPT_VISITS,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_OWN_DEALS,
    Permission.VIEW_TEAM_DEALS,
    Permission.VIEW_DEPT_DEALS,
    Permission.MANAGE_CUSTOMERS,
  ],
  SALES_SUPERVISOR: [
    Permission.VIEW_OWN_VISITS,
    Permission.VIEW_TEAM_VISITS,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_OWN_DEALS,
    Permission.VIEW_TEAM_DEALS,
    Permission.MANAGE_CUSTOMERS,
  ],
  SALES_EXECUTIVE: [
    Permission.VIEW_OWN_VISITS,
    Permission.VIEW_OWN_DEALS,
  ],
  DESIGN_MANAGER: [
    Permission.VIEW_OWN_VISITS,
    Permission.VIEW_TEAM_VISITS,
    Permission.VIEW_DEPT_VISITS,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_OWN_DEALS,
    Permission.VIEW_TEAM_DEALS,
    Permission.VIEW_DEPT_DEALS,
  ],
  DESIGN_SUPERVISOR: [
    Permission.VIEW_OWN_VISITS,
    Permission.VIEW_TEAM_VISITS,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_OWN_DEALS,
    Permission.VIEW_TEAM_DEALS,
  ],
  DESIGN_OFFICER: [
    Permission.VIEW_OWN_VISITS,
    Permission.VIEW_OWN_DEALS,
  ],
  FOREMAN_MANAGER: [
    Permission.VIEW_OWN_VISITS,
    Permission.VIEW_TEAM_VISITS,
    Permission.VIEW_DEPT_VISITS,
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_SITES,
  ],
  FOREMAN_SUPERVISOR: [
    Permission.VIEW_OWN_VISITS,
    Permission.VIEW_TEAM_VISITS,
    Permission.VIEW_DASHBOARD,
  ],
  FOREMAN: [
    Permission.VIEW_OWN_VISITS,
  ],
};

export async function getUserPermissions(tenantId: string, role: RoleType): Promise<Permission[]> {
  const overrides = await prisma.rolePermission.findMany({
    where: { tenantId, role },
  });

  if (overrides.length === 0) {
    return DEFAULT_PERMISSIONS[role] ?? [];
  }

  return overrides.filter((p) => p.granted).map((p) => p.permission);
}

export async function hasPermission(tenantId: string, role: RoleType, permission: Permission): Promise<boolean> {
  const permissions = await getUserPermissions(tenantId, role);
  return permissions.includes(permission);
}
