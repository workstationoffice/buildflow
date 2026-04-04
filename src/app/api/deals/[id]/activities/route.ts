import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";
import { ActivityType } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireTenantUser();
    const { id } = await params;
    const body = await req.json();
    const { type, title, description } = body;

    const deal = await prisma.deal.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const activity = await prisma.dealActivity.create({
      data: {
        dealId: id,
        userId: user.id,
        type: type as ActivityType,
        title,
        description,
      },
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
