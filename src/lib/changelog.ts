import { prisma } from "./prisma";
import { ChangeLogEntity } from "@prisma/client";

export async function logChange(params: {
  entityType: ChangeLogEntity;
  entityId: string;
  userId?: string;
  tenantId?: string;
  action: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
}) {
  await prisma.changeLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      userId: params.userId,
      tenantId: params.tenantId,
      action: params.action,
      field: params.field,
      oldValue: params.oldValue ? String(params.oldValue) : null,
      newValue: params.newValue ? String(params.newValue) : null,
    },
  });
}

export async function logObjectChanges(params: {
  entityType: ChangeLogEntity;
  entityId: string;
  userId?: string;
  tenantId?: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}) {
  const changedFields = Object.keys(params.after).filter(
    (key) => JSON.stringify(params.before[key]) !== JSON.stringify(params.after[key])
  );

  await Promise.all(
    changedFields.map((field) =>
      logChange({
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
        tenantId: params.tenantId,
        action: "UPDATE",
        field,
        oldValue: params.before[field] != null ? String(params.before[field]) : null,
        newValue: params.after[field] != null ? String(params.after[field]) : null,
      })
    )
  );
}
