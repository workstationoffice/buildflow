import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";
import { Permission, VisitStatus } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";
import { canViewUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireTenantUser();
    const { searchParams } = new URL(req.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status") as VisitStatus | null;
    const userId = searchParams.get("userId");

    const [canViewAll, canViewDept, canViewTeam] = await Promise.all([
      hasPermission(user.tenantId, user.role, Permission.VIEW_ALL_VISITS),
      hasPermission(user.tenantId, user.role, Permission.VIEW_DEPT_VISITS),
      hasPermission(user.tenantId, user.role, Permission.VIEW_TEAM_VISITS),
    ]);

    // Build user filter based on permissions
    let userIdFilter: string | undefined;
    if (canViewAll) {
      userIdFilter = userId ?? undefined;
    } else if (canViewDept || canViewTeam) {
      // Get visible users
      const allUsers = await prisma.user.findMany({
        where: { tenantId: user.tenantId, isActive: true },
        select: { id: true, role: true, department: true },
      });
      const visibleIds = allUsers
        .filter((u) => canViewUser(user as any, u as any))
        .map((u) => u.id);
      userIdFilter = userId && visibleIds.includes(userId) ? userId : undefined;
      if (!userId) {
        const visits = await prisma.visit.findMany({
          where: {
            tenantId: user.tenantId,
            userId: { in: visibleIds },
            ...(status && { status }),
            ...(startDate && endDate && {
              checkInAt: { gte: new Date(startDate), lte: new Date(endDate) },
            }),
          },
          include: { user: true, site: true, deal: true },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ visits });
      }
    } else {
      userIdFilter = user.id;
    }

    const visits = await prisma.visit.findMany({
      where: {
        tenantId: user.tenantId,
        userId: userIdFilter ?? user.id,
        ...(status && { status }),
        ...(startDate && endDate && {
          checkInAt: { gte: new Date(startDate), lte: new Date(endDate) },
        }),
      },
      include: { user: true, site: true, deal: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ visits });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
