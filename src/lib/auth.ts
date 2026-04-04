import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { RoleType, Department } from "@prisma/client";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { tenant: true },
  });

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");
  return user;
}

export async function requireTenantUser() {
  const user = await requireUser();
  if (!user.tenantId) redirect("/onboarding");
  return user;
}

// Determine department from role
export function getDepartmentFromRole(role: RoleType): Department {
  if (role === RoleType.COMPANY_ADMIN) return Department.MANAGEMENT;
  const salesRoles: RoleType[] = [RoleType.SALES_MANAGER, RoleType.SALES_SUPERVISOR, RoleType.SALES_EXECUTIVE];
  if (salesRoles.includes(role)) return Department.SALES;
  const designRoles: RoleType[] = [RoleType.DESIGN_MANAGER, RoleType.DESIGN_SUPERVISOR, RoleType.DESIGN_OFFICER];
  if (designRoles.includes(role)) return Department.DESIGN;
  return Department.OPERATIONS;
}

// Get role level (lower = higher authority)
export function getRoleLevel(role: RoleType): number {
  const levels: Record<RoleType, number> = {
    COMPANY_ADMIN: 1,
    SALES_MANAGER: 2,
    DESIGN_MANAGER: 2,
    FOREMAN_MANAGER: 2,
    SALES_SUPERVISOR: 3,
    DESIGN_SUPERVISOR: 3,
    FOREMAN_SUPERVISOR: 3,
    SALES_EXECUTIVE: 4,
    DESIGN_OFFICER: 4,
    FOREMAN: 4,
  };
  return levels[role];
}

// Check if a user can view another user's data based on hierarchy
export function canViewUser(viewer: { role: RoleType; department: Department; id: string }, target: { role: RoleType; department: Department; id: string }): boolean {
  if (viewer.role === RoleType.COMPANY_ADMIN) return true;
  if (viewer.id === target.id) return true;
  if (viewer.department !== target.department) return false;
  return getRoleLevel(viewer.role) < getRoleLevel(target.role);
}
