import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await requireTenantUser();
    const stages = await prisma.pipelineStage.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ stages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireTenantUser();
    const canManage = await hasPermission(user.tenantId, user.role, Permission.MANAGE_PIPELINE_STAGES);
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, color, order } = body;

    const stage = await prisma.pipelineStage.create({
      data: { tenantId: user.tenantId, name, color, order },
    });
    return NextResponse.json({ stage }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireTenantUser();
    const canManage = await hasPermission(user.tenantId, user.role, Permission.MANAGE_PIPELINE_STAGES);
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { stages } = body; // Array of { id, order }

    await Promise.all(
      stages.map(({ id, order }: { id: string; order: number }) =>
        prisma.pipelineStage.update({ where: { id }, data: { order } })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
