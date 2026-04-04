import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";
import { Permission, RoleType } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";
import { logChange } from "@/lib/changelog";
import { ChangeLogEntity } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await requireTenantUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const canManage = await hasPermission(user.tenantId, user.role, Permission.MANAGE_CUSTOMERS);

    // Sales executives only see their own customers
    const ownerFilter =
      user.role === RoleType.SALES_EXECUTIVE ? { ownerId: user.id } : {};

    const customers = await prisma.customer.findMany({
      where: {
        tenantId: user.tenantId,
        isActive: true,
        ...ownerFilter,
        ...(q && {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { companyName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        owner: { select: { id: true, name: true } },
        contactPersons: true,
        _count: { select: { deals: true } },
      },
      orderBy: { name: "asc" },
      take: q ? 20 : undefined,
    });

    return NextResponse.json({ customers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireTenantUser();
    const body = await req.json();
    const { type, name, email, phone, lineId, address, taxId, companyName, notes, contactPersons } = body;

    const customer = await prisma.customer.create({
      data: {
        tenantId: user.tenantId,
        ownerId: user.id,
        type,
        name,
        email,
        phone,
        lineId,
        address,
        taxId,
        companyName,
        notes,
        contactPersons: contactPersons?.length
          ? { create: contactPersons }
          : undefined,
      },
      include: { contactPersons: true },
    });

    await logChange({
      entityType: ChangeLogEntity.CUSTOMER,
      entityId: customer.id,
      userId: user.id,
      tenantId: user.tenantId,
      action: "CREATE",
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
