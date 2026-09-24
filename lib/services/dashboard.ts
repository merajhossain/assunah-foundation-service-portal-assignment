import { throwIfAborted } from "@/lib/api";
import type { AccessActor } from "@/lib/auth/access";
import {
  isRequesterRole,
  serviceRequestWhereForRole,
  serviceWhereForRole,
} from "@/lib/auth/access";
import { db } from "@/lib/db";

export type DashboardSummary = {
  services: {
    total: number;
    active: number;
    inactive: number;
    categories: number;
  };
  requests: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    urgent: number;
    high: number;
  };
  byCategory: Array<{
    category: string;
    services: number;
  }>;
};

function toNumber(value: unknown) {
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    return Number(value) || 0;
  }
  return 0;
}

export async function getDashboardSummary(
  actor: AccessActor,
  signal?: AbortSignal,
): Promise<DashboardSummary> {
  throwIfAborted(signal);

  const serviceWhere = serviceWhereForRole(actor);
  const requestWhere = serviceRequestWhereForRole(actor);
  const requesterView = isRequesterRole(actor.role);

  const [
    totalServices,
    activeServices,
    inactiveServices,
    categories,
    totalRequests,
    openRequests,
    inProgressRequests,
    resolvedRequests,
    closedRequests,
    urgentRequests,
    highRequests,
    categoryGroups,
  ] = await Promise.all([
    db.service.count({ where: serviceWhere }),
    db.service.count({
      where: requesterView ? serviceWhere : { ...serviceWhere, isActive: true },
    }),
    requesterView
      ? Promise.resolve(0)
      : db.service.count({ where: { ...serviceWhere, isActive: false } }),
    db.service
      .groupBy({
        by: ["category"],
        where: serviceWhere,
      })
      .then((rows) => rows.length),
    db.serviceRequest.count({ where: requestWhere }),
    db.serviceRequest.count({
      where: { ...requestWhere, status: "open" },
    }),
    db.serviceRequest.count({
      where: { ...requestWhere, status: "in_progress" },
    }),
    db.serviceRequest.count({
      where: { ...requestWhere, status: "resolved" },
    }),
    db.serviceRequest.count({
      where: { ...requestWhere, status: "closed" },
    }),
    db.serviceRequest.count({
      where: { ...requestWhere, priority: "urgent" },
    }),
    db.serviceRequest.count({
      where: { ...requestWhere, priority: "high" },
    }),
    db.service.groupBy({
      by: ["category"],
      where: serviceWhere,
      _count: { _all: true },
      orderBy: { category: "asc" },
    }),
  ]);

  throwIfAborted(signal);

  return {
    services: {
      total: totalServices,
      active: activeServices,
      inactive: inactiveServices,
      categories,
    },
    requests: {
      total: totalRequests,
      open: openRequests,
      inProgress: inProgressRequests,
      resolved: resolvedRequests,
      closed: closedRequests,
      urgent: urgentRequests,
      high: highRequests,
    },
    byCategory: categoryGroups.map((row) => ({
      category: row.category,
      services: toNumber(row._count._all),
    })),
  };
}
