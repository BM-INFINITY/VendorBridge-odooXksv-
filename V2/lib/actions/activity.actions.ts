"use server";

import { db } from "@/lib/db";
import { ActivityModule } from "@prisma/client";

// -----------------------------------------------------------------------------
// logActivity
// Internal utility. Called by all other Server Actions at mutation points.
// Inserts an append-only audit log record.
// Never called directly from UI.
// -----------------------------------------------------------------------------

interface LogActivityInput {
  userId: string;
  action: string;
  module: ActivityModule;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        module: input.module,
        entityId: input.entityId,
        metadata: (input.metadata ?? {}) as any,
      },
    });
  } catch (error) {
    // Activity logging should never break the main flow
    console.error("[logActivity] Failed to log activity:", error);
  }
}

// -----------------------------------------------------------------------------
// getActivityLogs
// Fetch paginated activity logs with optional module filter.
// Used by the /activity page (RSC data fetch).
// -----------------------------------------------------------------------------
export async function getActivityLogs(
  module?: ActivityModule,
  page: number = 1,
  pageSize: number = 20
) {
  const where = module ? { module } : {};

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.activityLog.count({ where }),
  ]);

  return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
