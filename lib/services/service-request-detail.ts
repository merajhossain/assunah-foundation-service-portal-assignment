import { Prisma } from "@/generated/prisma/client";
import { throwIfAborted, ApiError } from "@/lib/api";
import type { AccessActor } from "@/lib/auth/access";
import {
  ROLES,
  canEditRequestFields,
  canRequesterEditRequest,
  canUpdateServiceRequestStatus,
  isAdminRole,
  isSolvedStatus,
  serviceRequestWhereForRole,
} from "@/lib/auth/access";
import { db } from "@/lib/db";
import { SOLVED_STATUSES } from "@/lib/services/service-request-status";
import type { UpdateServiceRequestInput } from "@/lib/validations/service-request";

export const ACTIVITY_PAGE_SIZE = 50;

export type ServiceRequestActivity = {
  id: number;
  action: string;
  fromValue: string | null;
  toValue: string | null;
  note: string | null;
  createdAt: string;
  actorName: string;
};

export type ActivityPage = {
  activities: ServiceRequestActivity[];
  nextCursor: number | null;
};

export type AssignableOfficer = {
  id: number;
  name: string;
  email: string;
};

export type OfficerLoadRow = {
  officerId: number;
  officerName: string;
  assigned: number;
  resolved: number;
  avgResolutionHours: number | null;
};

export type ServiceRequestDetail = {
  id: number;
  publicId: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  requester: {
    id: number;
    name: string;
    email: string;
  };
  assignee: {
    id: number;
    name: string;
    email: string;
  } | null;
  service: {
    id: number;
    name: string;
    slug: string;
  };
  activities: ServiceRequestActivity[];
  activitiesTotal: number;
  activitiesNextCursor: number | null;
  assignableOfficers: AssignableOfficer[];
  canUpdate: boolean;
  canEditFields: boolean;
  requiresNoteOnChange: boolean;
  /** Requester may edit subject, description, service, and priority while the request is open. */
  canRequesterEdit: boolean;
  /** This viewer submitted the request, so the edit control is shown even when locked. */
  showRequesterEdit: boolean;
};

export type UpdatedServiceRequest = {
  publicId: string;
  status: string;
  assigneeId: number | null;
  updatedAt: string;
};

const STAFF_ROLE_NAMES = [ROLES.MANAGER, ROLES.OFFICE, ROLES.ADMIN];

const activitySelect = {
  id: true,
  action: true,
  fromValue: true,
  toValue: true,
  note: true,
  createdAt: true,
  actor: { select: { name: true } },
} satisfies Prisma.ServiceActivitySelect;

const activityOrder: Prisma.ServiceActivityOrderByWithRelationInput[] = [
  { createdAt: "desc" },
  { id: "desc" },
];

function mapActivities(
  activities: Prisma.ServiceActivityGetPayload<{ select: typeof activitySelect }>[],
): ServiceRequestActivity[] {
  return activities.map((activity) => ({
    id: activity.id,
    action: activity.action,
    fromValue: activity.fromValue,
    toValue: activity.toValue,
    note: activity.note,
    createdAt: activity.createdAt.toISOString(),
    actorName: activity.actor.name,
  }));
}

/** Fetches one extra row to know whether another page exists. */
function toActivityPage(
  rows: Prisma.ServiceActivityGetPayload<{ select: typeof activitySelect }>[],
): ActivityPage {
  const hasMore = rows.length > ACTIVITY_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, ACTIVITY_PAGE_SIZE) : rows;
  return {
    activities: mapActivities(page),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

async function listAssignableOfficers(): Promise<AssignableOfficer[]> {
  return db.user.findMany({
    where: { role: { name: { in: STAFF_ROLE_NAMES } } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

async function findVisibleRequestId(
  actor: AccessActor,
  publicId: string,
): Promise<number> {
  const request = await db.serviceRequest.findFirst({
    where: { AND: [{ publicId }, serviceRequestWhereForRole(actor)] },
    select: { id: true },
  });

  if (!request) {
    throw new ApiError("NOT_FOUND", "Service request not found.", 404);
  }

  return request.id;
}

export async function getServiceRequestDetail(
  actor: AccessActor,
  publicId: string,
  signal?: AbortSignal,
): Promise<ServiceRequestDetail> {
  throwIfAborted(signal);

  const request = await db.serviceRequest.findFirst({
    where: {
      AND: [{ publicId }, serviceRequestWhereForRole(actor)],
    },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, name: true, slug: true } },
      activities: {
        orderBy: activityOrder,
        take: ACTIVITY_PAGE_SIZE + 1,
        select: activitySelect,
      },
      _count: { select: { activities: true } },
    },
  });

  throwIfAborted(signal);

  if (!request) {
    throw new ApiError("NOT_FOUND", "Service request not found.", 404);
  }

  const canUpdate = canUpdateServiceRequestStatus(actor.role);
  const canEditFields = canEditRequestFields(actor.role, request.status);
  const requiresNoteOnChange = isAdminRole(actor.role);
  const assignableOfficers = canUpdate ? await listAssignableOfficers() : [];

  throwIfAborted(signal);

  const activityPage = toActivityPage(request.activities);

  return {
    id: request.id,
    publicId: request.publicId,
    subject: request.subject,
    description: request.description,
    category: request.category,
    priority: request.priority,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    resolvedAt: request.resolvedAt?.toISOString() ?? null,
    requester: request.requester,
    assignee: request.assignee,
    service: request.service,
    activities: activityPage.activities,
    activitiesTotal: request._count.activities,
    activitiesNextCursor: activityPage.nextCursor,
    assignableOfficers,
    canUpdate,
    canEditFields,
    requiresNoteOnChange,
    canRequesterEdit: canRequesterEditRequest(actor, {
      requesterId: request.requester.id,
      status: request.status,
    }),
    showRequesterEdit:
      actor.role === ROLES.REQUESTER && request.requester.id === actor.id,
  };
}

export async function getServiceRequestActivities(
  actor: AccessActor,
  publicId: string,
  cursor: number | null,
  signal?: AbortSignal,
): Promise<ActivityPage> {
  throwIfAborted(signal);

  const requestId = await findVisibleRequestId(actor, publicId);

  throwIfAborted(signal);

  const rows = await db.serviceActivity.findMany({
    where: { requestId },
    orderBy: activityOrder,
    take: ACTIVITY_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: activitySelect,
  });

  throwIfAborted(signal);

  return toActivityPage(rows);
}

/**
 * `assigned` activities store the assignee user id; rows written before that
 * change store the assignee email instead.
 */
async function collectTrailOfficerIds(requestId: number) {
  const [request, assignments] = await Promise.all([
    db.serviceRequest.findUnique({
      where: { id: requestId },
      select: { assigneeId: true },
    }),
    db.serviceActivity.findMany({
      where: { requestId, action: "assigned" },
      select: { fromValue: true, toValue: true },
    }),
  ]);

  const ids = new Set<number>();
  if (request?.assigneeId) {
    ids.add(request.assigneeId);
  }

  const emails: string[] = [];
  for (const value of assignments.flatMap((row) => [row.fromValue, row.toValue])) {
    if (!value) {
      continue;
    }
    if (/^\d+$/.test(value)) {
      ids.add(Number(value));
    } else if (value.includes("@")) {
      emails.push(value);
    }
  }

  if (emails.length > 0) {
    const users = await db.user.findMany({
      where: { email: { in: [...new Set(emails)] } },
      select: { id: true },
    });
    for (const user of users) {
      ids.add(user.id);
    }
  }

  return [...ids];
}

type ResolvedAggregateRow = {
  officerId: number;
  resolved: bigint | number;
  avgMinutes: Prisma.Decimal | number | string | null;
};

export async function getOfficerLoad(
  requestId: number,
): Promise<OfficerLoadRow[]> {
  const officerIds = await collectTrailOfficerIds(requestId);
  if (officerIds.length === 0) {
    return [];
  }

  const [officers, openGroups, resolvedRows] = await Promise.all([
    db.user.findMany({
      where: { id: { in: officerIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.serviceRequest.groupBy({
      by: ["assigneeId"],
      where: {
        assigneeId: { in: officerIds },
        status: { notIn: [...SOLVED_STATUSES] },
      },
      _count: { _all: true },
    }),
    db.$queryRaw<ResolvedAggregateRow[]>`
      SELECT assignee_id AS officerId,
             COUNT(*) AS resolved,
             AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) AS avgMinutes
      FROM service_requests
      WHERE assignee_id IN (${Prisma.join(officerIds)})
        AND status IN (${Prisma.join([...SOLVED_STATUSES])})
        AND resolved_at IS NOT NULL
      GROUP BY assignee_id
    `,
  ]);

  const openById = new Map(
    openGroups.map((row) => [row.assigneeId, row._count._all]),
  );
  const resolvedById = new Map(
    resolvedRows.map((row) => [Number(row.officerId), row]),
  );

  return officers.map((officer) => {
    const resolved = resolvedById.get(officer.id);
    const avgMinutes =
      resolved?.avgMinutes === null || resolved?.avgMinutes === undefined
        ? null
        : Number(resolved.avgMinutes);

    return {
      officerId: officer.id,
      officerName: officer.name,
      assigned: openById.get(officer.id) ?? 0,
      resolved: resolved ? Number(resolved.resolved) : 0,
      avgResolutionHours:
        avgMinutes === null ? null : Math.round((avgMinutes / 60) * 10) / 10,
    };
  });
}

function nextResolvedAt(
  currentStatus: string,
  nextStatus: string,
  currentResolvedAt: Date | null,
) {
  const wasSolved = isSolvedStatus(currentStatus);
  const willBeSolved = isSolvedStatus(nextStatus);

  if (!willBeSolved) {
    return null;
  }
  if (!wasSolved) {
    return new Date();
  }
  return currentResolvedAt ?? new Date();
}

export async function updateServiceRequest(
  actor: AccessActor,
  publicId: string,
  input: UpdateServiceRequestInput,
  signal?: AbortSignal,
): Promise<UpdatedServiceRequest> {
  throwIfAborted(signal);

  if (!canUpdateServiceRequestStatus(actor.role)) {
    throw new ApiError(
      "FORBIDDEN",
      "You do not have permission to update this request.",
      403,
    );
  }

  const existing = await db.serviceRequest.findFirst({
    where: {
      AND: [{ publicId }, serviceRequestWhereForRole(actor)],
    },
    select: {
      id: true,
      status: true,
      assigneeId: true,
      resolvedAt: true,
      updatedAt: true,
    },
  });

  throwIfAborted(signal);

  if (!existing) {
    throw new ApiError("NOT_FOUND", "Service request not found.", 404);
  }

  const expectedUpdatedAt = new Date(input.expectedUpdatedAt);
  if (existing.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
    throw new ApiError(
      "CONFLICT",
      "This request was changed by someone else. Reload to see the latest version.",
      409,
    );
  }

  const statusChanged = existing.status !== input.status;
  const assigneeChanged = (existing.assigneeId ?? null) !== input.assigneeId;

  if (!statusChanged && !assigneeChanged) {
    throw new ApiError("VALIDATION_ERROR", "No changes to save.", 400);
  }

  if (!canEditRequestFields(actor.role, existing.status)) {
    throw new ApiError(
      "FORBIDDEN",
      isSolvedStatus(existing.status)
        ? "This request is solved. Only an admin can update it."
        : "You do not have permission to update this request.",
      403,
    );
  }

  const adminNote = input.note?.trim();

  if (isAdminRole(actor.role) && !adminNote) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "A note is required when an admin changes status or assignee.",
      400,
    );
  }

  let nextAssignee: { id: number; name: string } | null = null;
  if (input.assigneeId !== null) {
    nextAssignee = await db.user.findFirst({
      where: {
        id: input.assigneeId,
        role: { name: { in: STAFF_ROLE_NAMES } },
      },
      select: { id: true, name: true },
    });

    if (!nextAssignee) {
      throw new ApiError("VALIDATION_ERROR", "Invalid assignee.", 400);
    }
  }

  throwIfAborted(signal);

  const updated = await db.$transaction(async (tx) => {
    const result = await tx.serviceRequest.updateMany({
      where: { id: existing.id, updatedAt: existing.updatedAt },
      data: {
        status: input.status,
        assigneeId: input.assigneeId,
        resolvedAt: nextResolvedAt(
          existing.status,
          input.status,
          existing.resolvedAt,
        ),
      },
    });

    if (result.count === 0) {
      throw new ApiError(
        "CONFLICT",
        "This request was changed by someone else. Reload to see the latest version.",
        409,
      );
    }

    if (statusChanged) {
      await tx.serviceActivity.create({
        data: {
          requestId: existing.id,
          actorId: actor.id,
          action: "status_changed",
          fromValue: existing.status,
          toValue: input.status,
          note: adminNote ?? `Status moved to ${input.status}.`,
        },
      });
    }

    if (assigneeChanged) {
      await tx.serviceActivity.create({
        data: {
          requestId: existing.id,
          actorId: actor.id,
          action: "assigned",
          fromValue: existing.assigneeId ? String(existing.assigneeId) : null,
          toValue: nextAssignee ? String(nextAssignee.id) : null,
          note:
            adminNote ??
            (nextAssignee
              ? `Assigned to ${nextAssignee.name}.`
              : "Assignee cleared."),
        },
      });
    }

    return tx.serviceRequest.findUniqueOrThrow({
      where: { id: existing.id },
      select: { publicId: true, status: true, assigneeId: true, updatedAt: true },
    });
  });

  throwIfAborted(signal);

  return {
    publicId: updated.publicId,
    status: updated.status,
    assigneeId: updated.assigneeId,
    updatedAt: updated.updatedAt.toISOString(),
  };
}
