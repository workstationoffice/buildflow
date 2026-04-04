import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";
import { Permission, RoleType } from "@prisma/client";
import { hasPermission, DEFAULT_PERMISSIONS } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await requireTenantUser();
    const canManage = await hasPermission(user.tenantId, user.role, Permission.MANAGE_PERMISSIONS);
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const overrides = await prisma.rolePermission.findMany({
      where: { tenantId: user.tenantId },
    });

    // Build full permission matrix
    const matrix = Object.values(RoleType).reduce((acc, role) => {
      const roleOverrides = overrides.filter((o) => o.role === role);
      const base = DEFAULT_PERMISSIONS[role] ?? [];

      const permissions = Object.values(Permission).reduce((pAcc, perm) => {
        const override = roleOverrides.find((o) => o.permission === perm);
        pAcc[perm] = override ? override.granted : base.includes(perm);
        return pAcc;
      }, {} as Record<Permission, boolean>);

      acc[role] = permissions;
      return acc;
    }, {} as Record<RoleType, Record<Permission, boolean>>);

    return NextResponse.json({ matrix, allPermissions: Object.values(Permission) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireTenantUser();
    const canManage = await hasPermission(user.tenantId, user.role, Permission.MANAGE_PERMISSIONS);
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { role, permission, granted } = body;

    await prisma.rolePermission.upsert({
      where: { tenantId_role_permission: { tenantId: user.tenantId, role, permission } },
      update: { granted },
      create: { tenantId: user.tenantId, role, permission, granted },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
