import { throwIfAborted, ApiError } from "@/lib/api";
import type { AccessActor } from "@/lib/auth/access";
import {
  ROLES,
  canAssignOnCreate,
  canCreateServiceRequest,
  serviceWhereForRole,
} from "@/lib/auth/access";
import { db } from "@/lib/db";
import { priorityRankOf } from "@/lib/services/service-request-status";
import type { CreateServiceRequestInput } from "@/lib/validations/service-request";

export type ServiceOption = {
  id: number;
  name: string;
  category: string;
};

export type OfficerOption = {
  id: number;
  name: string;
  email: string;
};

export type CreateServiceRequestOptions = {
  services: ServiceOption[];
  officers: OfficerOption[];
  canAssign: boolean;
};

export type CreatedServiceRequest = {
  id: number;
  publicId: string;
};

async function nextPublicId(signal?: AbortSignal) {
  throwIfAborted(signal);
  const year = new Date().getFullYear();
  const prefix = `SR-${year}-`;

  const latest = await db.serviceRequest.findFirst({
    where: { publicId: { startsWith: prefix } },
    orderBy: { publicId: "desc" },
    select: { publicId: true },
  });

  const lastSeq = latest
    ? Number(latest.publicId.slice(prefix.length))
    : 0;
  const nextSeq = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

export async function getCreateServiceRequestOptions(
  actor: AccessActor,
  signal?: AbortSignal,
): Promise<CreateServiceRequestOptions> {
  throwIfAborted(signal);

  if (!canCreateServiceRequest(actor.role)) {
    throw new ApiError(
      "FORBIDDEN",
      "You do not have permission to create requests.",
      403,
    );
  }

  const canAssign = canAssignOnCreate(actor.role);

  const [services, officers] = await Promise.all([
    db.service.findMany({
      where: serviceWhereForRole(actor),
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
    canAssign
      ? db.user.findMany({
          where: {
            role: {
              name: { in: [ROLES.MANAGER, ROLES.OFFICE, ROLES.ADMIN] },
            },
          },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  throwIfAborted(signal);

  return {
    services,
    officers,
    canAssign,
  };
}

export async function createServiceRequest(
  actor: AccessActor,
  input: CreateServiceRequestInput,
  signal?: AbortSignal,
): Promise<CreatedServiceRequest> {
  throwIfAborted(signal);

  if (!canCreateServiceRequest(actor.role)) {
    throw new ApiError(
      "FORBIDDEN",
      "You do not have permission to create requests.",
      403,
    );
  }

  const service = await db.service.findFirst({
    where: {
      AND: [{ id: input.serviceId }, serviceWhereForRole(actor)],
    },
    select: { id: true, category: true, name: true, isActive: true },
  });

  throwIfAborted(signal);

  if (!service || !service.isActive) {
    throw new ApiError("VALIDATION_ERROR", "Invalid service selected.", 400);
  }

  let assigneeId: number | null = null;
  let assigneeName: string | null = null;

  if (input.assigneeId !== null) {
    if (!canAssignOnCreate(actor.role)) {
      throw new ApiError(
        "FORBIDDEN",
        "You cannot assign a request on create.",
        403,
      );
    }

    const assignee = await db.user.findFirst({
      where: {
        id: input.assigneeId,
        role: {
          name: { in: [ROLES.MANAGER, ROLES.OFFICE, ROLES.ADMIN] },
        },
      },
      select: { id: true, name: true, email: true },
    });

    if (!assignee) {
      throw new ApiError("VALIDATION_ERROR", "Invalid assignee.", 400);
    }

    assigneeId = assignee.id;
    assigneeName = assignee.name;
  }

  const publicId = await nextPublicId(signal);

  throwIfAborted(signal);

  const created = await db.$transaction(async (tx) => {
    const request = await tx.serviceRequest.create({
      data: {
        publicId,
        subject: input.subject,
        description: input.description,
        requesterId: actor.id,
        serviceId: service.id,
        category: service.category,
        priority: input.priority,
        priorityRank: priorityRankOf(input.priority),
        status: "open",
        assigneeId,
      },
      select: { id: true, publicId: true },
    });

    await tx.serviceActivity.create({
      data: {
        requestId: request.id,
        actorId: actor.id,
        action: "created",
        fromValue: null,
        toValue: "open",
        note: "Service request submitted.",
      },
    });

    if (assigneeId) {
      await tx.serviceActivity.create({
        data: {
          requestId: request.id,
          actorId: actor.id,
          action: "assigned",
          fromValue: null,
          toValue: String(assigneeId),
          note: `Assigned to ${assigneeName}.`,
        },
      });
    }

    return request;
  });

  throwIfAborted(signal);

  return created;
}
