import { ApiError, throwIfAborted } from "@/lib/api";
import type { AccessActor } from "@/lib/auth/access";
import {
  canRequesterEditRequest,
  isSolvedStatus,
  serviceRequestWhereForRole,
  serviceWhereForRole,
} from "@/lib/auth/access";
import { db } from "@/lib/db";
import { priorityRankOf } from "@/lib/services/service-request-status";
import type { EditRequesterRequestInput } from "@/lib/validations/service-request";

export type EditedServiceRequest = {
  publicId: string;
  updatedAt: string;
};

function clip(value: string) {
  return value.length <= 255 ? value : `${value.slice(0, 252)}...`;
}

export async function updateRequesterServiceRequest(
  actor: AccessActor,
  publicId: string,
  input: EditRequesterRequestInput,
  signal?: AbortSignal,
): Promise<EditedServiceRequest> {
  throwIfAborted(signal);

  const existing = await db.serviceRequest.findFirst({
    where: {
      AND: [{ publicId }, serviceRequestWhereForRole(actor)],
    },
    select: {
      id: true,
      requesterId: true,
      status: true,
      subject: true,
      description: true,
      serviceId: true,
      priority: true,
      updatedAt: true,
      service: { select: { name: true } },
    },
  });

  throwIfAborted(signal);

  if (!existing) {
    throw new ApiError("NOT_FOUND", "Service request not found.", 404);
  }

  if (!canRequesterEditRequest(actor, existing)) {
    throw new ApiError(
      "FORBIDDEN",
      isSolvedStatus(existing.status)
        ? "This request can no longer be edited."
        : "You do not have permission to edit this request.",
      403,
    );
  }

  const expectedUpdatedAt = new Date(input.expectedUpdatedAt);
  if (existing.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
    throw new ApiError(
      "CONFLICT",
      "This request was changed by someone else. Reload to see the latest version.",
      409,
    );
  }

  const service = await db.service.findFirst({
    where: {
      AND: [{ id: input.serviceId }, serviceWhereForRole(actor)],
    },
    select: { id: true, category: true, name: true, isActive: true },
  });

  if (!service || !service.isActive) {
    throw new ApiError("VALIDATION_ERROR", "Invalid service selected.", 400);
  }

  const subjectChanged = existing.subject !== input.subject;
  const descriptionChanged = existing.description !== input.description;
  const serviceChanged = existing.serviceId !== service.id;
  const priorityChanged = existing.priority !== input.priority;

  if (!subjectChanged && !descriptionChanged && !serviceChanged && !priorityChanged) {
    throw new ApiError("VALIDATION_ERROR", "No changes to save.", 400);
  }

  throwIfAborted(signal);

  const updated = await db.$transaction(async (tx) => {
    const result = await tx.serviceRequest.updateMany({
      where: { id: existing.id, updatedAt: existing.updatedAt },
      data: {
        subject: input.subject,
        description: input.description,
        serviceId: service.id,
        category: service.category,
        priority: input.priority,
        priorityRank: priorityRankOf(input.priority),
      },
    });

    if (result.count === 0) {
      throw new ApiError(
        "CONFLICT",
        "This request was changed by someone else. Reload to see the latest version.",
        409,
      );
    }

    const activities: {
      action: string;
      fromValue: string | null;
      toValue: string | null;
      note: string;
    }[] = [];

    if (subjectChanged) {
      activities.push({
        action: "subject_changed",
        fromValue: clip(existing.subject),
        toValue: clip(input.subject),
        note: `Subject changed to "${input.subject}".`,
      });
    }
    if (descriptionChanged) {
      activities.push({
        action: "description_changed",
        fromValue: clip(existing.description),
        toValue: clip(input.description),
        note: "Description updated.",
      });
    }
    if (serviceChanged) {
      activities.push({
        action: "service_changed",
        fromValue: clip(existing.service.name),
        toValue: clip(service.name),
        note: `Service changed from ${existing.service.name} to ${service.name}.`,
      });
    }
    if (priorityChanged) {
      activities.push({
        action: "priority_changed",
        fromValue: existing.priority,
        toValue: input.priority,
        note: `Priority moved to ${input.priority}.`,
      });
    }

    await tx.serviceActivity.createMany({
      data: activities.map((activity) => ({
        requestId: existing.id,
        actorId: actor.id,
        ...activity,
      })),
    });

    return tx.serviceRequest.findUniqueOrThrow({
      where: { id: existing.id },
      select: { publicId: true, updatedAt: true },
    });
  });

  throwIfAborted(signal);

  return {
    publicId: updated.publicId,
    updatedAt: updated.updatedAt.toISOString(),
  };
}
