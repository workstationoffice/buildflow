import { requireTenantUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@prisma/client";
import UsersClient from "./users-client";

export default async function UsersPage() {
  const user = await requireTenantUser();
  const canManage = await hasPermission(user.tenantId, user.role, Permission.MANAGE_USERS);

  const users = await prisma.user.findMany({
    where: { tenantId: user.tenantId },
    select: {
      id: true, name: true, email: true, role: true, department: true,
      avatarUrl: true, isActive: true, phone: true, clerkId: true,
    },
    orderBy: [{ department: "asc" }, { role: "asc" }, { name: "asc" }],
  });

  return <UsersClient users={users} canManage={canManage} />;
}
