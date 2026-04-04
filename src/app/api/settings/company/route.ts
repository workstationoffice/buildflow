import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@prisma/client";

export async function PUT(req: NextRequest) {
  try {
    const user = await requireTenantUser();
    const canManage = await hasPermission(user.tenantId, user.role, Permission.MANAGE_TENANT);
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, timezone } = await req.json();

    const tenant = await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        ...(name && { name }),
        ...(timezone && { timezone }),
      },
    });

    return NextResponse.json({ tenant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
