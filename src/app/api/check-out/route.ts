import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";
import { VisitStatus } from "@prisma/client";

function getDeviceType(userAgent: string) {
  return /mobile|android|iphone|ipad/i.test(userAgent) ? "MOBILE" : "DESKTOP";
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireTenantUser();
    const userAgent = req.headers.get("user-agent") ?? "";
    const deviceType = getDeviceType(userAgent);

    const body = await req.json();
    const { visitId, latitude, longitude, address, jobSummary } = body;

    if (!visitId || !jobSummary) {
      return NextResponse.json({ error: "visitId and jobSummary are required" }, { status: 400 });
    }

    const visit = await prisma.visit.findFirst({
      where: { id: visitId, userId: user.id, status: VisitStatus.CHECKED_IN },
    });

    if (!visit) {
      return NextResponse.json({ error: "Active check-in not found" }, { status: 404 });
    }

    const updated = await prisma.visit.update({
      where: { id: visitId },
      data: {
        status: VisitStatus.CHECKED_OUT,
        checkOutAt: new Date(),
        checkOutLat: latitude,
        checkOutLng: longitude,
        checkOutAddress: address,
        checkOutDevice: deviceType as any,
        jobSummary,
      },
    });

    return NextResponse.json({ visit: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
