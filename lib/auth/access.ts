export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  OFFICE: "office",
  REQUESTER: "requester",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export type AccessActor = {
  id: number;
  role: string;
};

export function parseAccessActor(user: {
  id?: string | null;
  role?: string | null;
}): AccessActor | null {
  const id = Number(user.id);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  return {
    id,
    role: user.role ?? "",
  };
}

export function isStaffRole(role: string) {
  return (
    role === ROLES.ADMIN ||
    role === ROLES.MANAGER ||
    role === ROLES.OFFICE
  );
}

export function isRequesterRole(role: string) {
  return role === ROLES.REQUESTER;
}

export function canUpdateServiceRequestStatus(role: string) {
  return isStaffRole(role);
}

/** Requester, admin, manager, and office can open New Request. */
export function canCreateServiceRequest(role: string) {
  return (
    isRequesterRole(role) ||
    role === ROLES.ADMIN ||
    role === ROLES.MANAGER ||
    role === ROLES.OFFICE
  );
}

export function canAssignOnCreate(role: string) {
  return isStaffRole(role);
}

export function isAdminRole(role: string) {
  return role === ROLES.ADMIN;
}

export function isSolvedStatus(status: string) {
  return status === "resolved" || status === "closed";
}

/** The requester who submitted the ticket can edit it only while it is still open. */
export function canRequesterEditRequest(
  actor: AccessActor,
  request: { requesterId: number; status: string },
) {
  return (
    isRequesterRole(actor.role) &&
    request.requesterId === actor.id &&
    request.status === "open"
  );
}

/** Only admin can edit status/assignee after resolved/closed. */
export function canEditRequestFields(role: string, currentStatus: string) {
  if (!canUpdateServiceRequestStatus(role)) {
    return false;
  }
  if (isSolvedStatus(currentStatus) && !isAdminRole(role)) {
    return false;
  }
  return true;
}

/** @deprecated Use canEditRequestFields */
export function canChangeRequestStatus(role: string, currentStatus: string) {
  return canEditRequestFields(role, currentStatus);
}

/**
 * Request visibility (all statuses, including resolved/closed):
 * - admin → full queue
 * - manager / office → assigned to them, or they previously acted on
 * - requester → requests they submitted
 * - unknown role → no rows
 */
export function serviceRequestWhereForRole(actor: AccessActor) {
  if (actor.role === ROLES.ADMIN) {
    return {};
  }

  if (actor.role === ROLES.MANAGER || actor.role === ROLES.OFFICE) {
    return {
      OR: [
        { assigneeId: actor.id },
        { activities: { some: { actorId: actor.id } } },
      ],
    };
  }

  if (isRequesterRole(actor.role)) {
    return { requesterId: actor.id };
  }

  return { id: -1 };
}

/**
 * Service catalog visibility:
 * - admin / manager / office → all services
 * - requester → active services only
 * - unknown role → none
 */
export function serviceWhereForRole(actor: AccessActor) {
  if (isStaffRole(actor.role)) {
    return {};
  }

  if (isRequesterRole(actor.role)) {
    return { isActive: true };
  }

  return { id: -1 };
}
