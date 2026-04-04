import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";
import { syncToGoogleCalendar, deleteGoogleCalendarEvent } from "@/lib/google-calendar";
import { syncToMicrosoftCalendar, deleteMicrosoftCalendarEvent } from "@/lib/microsoft-calendar";
import { auth, clerkClient } from "@clerk/nextjs/server";

async function getOAuthToken(clerkId: string, provider: "google" | "microsoft") {
  const client = await clerkClient();
  const tokens = await client.users.getUserOauthAccessToken(clerkId, `oauth_${provider}`);
  return tokens.data?.[0]?.token ?? null;
}

// POST /api/calendar-sync — create or update plan + sync
export async function POST(req: NextRequest) {
  try {
    const user = await requireTenantUser();
    const body = await req.json();
    const { planId, title, description, plannedDate, siteId, dealId } = body;

    const date = new Date(plannedDate);

    let plan;
    if (planId) {
      plan = await prisma.calendarPlan.update({
        where: { id: planId },
        data: { title, description, plannedDate: date, siteId, dealId },
      });
    } else {
      plan = await prisma.calendarPlan.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          title,
          description,
          plannedDate: date,
          siteId,
          dealId,
        },
      });
    }

    // Attempt calendar sync (gracefully handle missing tokens)
    const [googleToken, microsoftToken] = await Promise.all([
      getOAuthToken(user.clerkId, "google").catch(() => null),
      getOAuthToken(user.clerkId, "microsoft").catch(() => null),
    ]);

    const syncUpdates: { googleEventId?: string; microsoftEventId?: string } = {};

    if (googleToken) {
      const eventId = await syncToGoogleCalendar(googleToken, {
        id: plan.id,
        title: plan.title,
        description: plan.description ?? undefined,
        plannedDate: plan.plannedDate,
        googleEventId: plan.googleEventId,
      }).catch(() => null);
      if (eventId) syncUpdates.googleEventId = eventId;
    }

    if (microsoftToken) {
      const eventId = await syncToMicrosoftCalendar(microsoftToken, {
        id: plan.id,
        title: plan.title,
        description: plan.description ?? undefined,
        plannedDate: plan.plannedDate,
        microsoftEventId: plan.microsoftEventId,
      }).catch(() => null);
      if (eventId) syncUpdates.microsoftEventId = eventId;
    }

    if (Object.keys(syncUpdates).length > 0) {
      plan = await prisma.calendarPlan.update({
        where: { id: plan.id },
        data: syncUpdates,
      });
    }

    return NextResponse.json({ plan }, { status: planId ? 200 : 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/calendar-sync?planId=xxx
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireTenantUser();
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("planId");

    if (!planId) return NextResponse.json({ error: "planId required" }, { status: 400 });

    const plan = await prisma.calendarPlan.findFirst({
      where: { id: planId, userId: user.id },
    });

    if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [googleToken, microsoftToken] = await Promise.all([
      getOAuthToken(user.clerkId, "google").catch(() => null),
      getOAuthToken(user.clerkId, "microsoft").catch(() => null),
    ]);

    await Promise.allSettled([
      googleToken && plan.googleEventId ? deleteGoogleCalendarEvent(googleToken, plan.googleEventId) : Promise.resolve(),
      microsoftToken && plan.microsoftEventId ? deleteMicrosoftCalendarEvent(microsoftToken, plan.microsoftEventId) : Promise.resolve(),
    ]);

    await prisma.calendarPlan.delete({ where: { id: planId } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
