import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ invite: null });

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    if (!email) return NextResponse.json({ invite: null });

    const pending = await prisma.user.findFirst({
      where: { email, clerkId: { startsWith: "pending_" }, isActive: false },
      include: { tenant: true },
    });

    if (!pending) return NextResponse.json({ invite: null });

    const roleLabel = pending.role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

    return NextResponse.json({
      invite: {
        company: pending.tenant.name,
        role: roleLabel,
      },
    });
  } catch {
    return NextResponse.json({ invite: null });
  }
}
