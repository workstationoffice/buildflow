import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/auth";
import { Permission, StorageProvider } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

export async function PUT(req: NextRequest) {
  try {
    const user = await requireTenantUser();
    const canManage = await hasPermission(user.tenantId, user.role, Permission.MANAGE_STORAGE);
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { provider, sharepointSiteId, onedriveFolder, googleDriveFolderId } = body;

    const config = await prisma.storageConfig.upsert({
      where: { tenantId: user.tenantId },
      update: { provider, sharepointSiteId, onedriveFolder, googleDriveFolderId },
      create: { tenantId: user.tenantId, provider, sharepointSiteId, onedriveFolder, googleDriveFolderId },
    });

    return NextResponse.json({ config });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
