import type { Prisma } from "@/generated/prisma/client";
import { throwIfAborted } from "@/lib/api";
import type { AccessActor } from "@/lib/auth/access";
import { serviceRequestWhereForRole } from "@/lib/auth/access";
import { db } from "@/lib/db";
import type { ServiceRequestListQuery } from "@/lib/services/service-request-query";
import {
  DEFAULT_PAGE_SIZE,
  UNASSIGNED_ASSIGNEE,
} from "@/lib/services/service-request-query";

export type ServiceRequestRow = {
  id: number;
  publicId: string;
  subject: string;
  requesterName: string;
  category: string;
  priority: string;
  status: string;
  assigneeName: string | null;
  updatedAt: string;
};

export type ServiceRequestFacets = {
  statuses: string[];
  categories: string[];
  priorities: string[];
  assignees: string[];
};

export type ServiceRequestsListResult = {
  rows: ServiceRequestRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  facets: ServiceRequestFacets;
  query: ServiceRequestListQuery;
};

const rowSelect = {
  id: true,
  publicId: true,
  subject: true,
  category: true,
  priority: true,
  status: true,
  updatedAt: true,
  requester: { select: { name: true } },
  assignee: { select: { name: true } },
} satisfies Prisma.ServiceRequestSelect;

function buildFilterWhere(
  query: ServiceRequestListQuery,
): Prisma.ServiceRequestWhereInput[] {
  const filters: Prisma.ServiceRequestWhereInput[] = [];

  if (query.status) {
    filters.push({ status: query.status });
  }
  if (query.category) {
    filters.push({ category: query.category });
  }
  if (query.priority) {
    filters.push({ priority: query.priority });
  }
  if (query.assignee === UNASSIGNED_ASSIGNEE) {
    filters.push({ assigneeId: null });
  } else if (query.assignee) {
    filters.push({ assignee: { name: query.assignee } });
  }

  const q = query.q?.trim();
  if (q) {
    const or: Prisma.ServiceRequestWhereInput[] = [
      { publicId: { contains: q } },
      { subject: { contains: q } },
      { requester: { name: { contains: q } } },
      { assignee: { name: { contains: q } } },
    ];

    const bare = q.replace(/^#/, "");
    const asId = Number(bare);
    if (Number.isInteger(asId) && asId > 0 && String(asId) === bare) {
      or.push({ id: asId });
    }

    filters.push({ OR: or });
  }

  return filters;
}

function orderByFor(
  sort: ServiceRequestListQuery["sort"],
): Prisma.ServiceRequestOrderByWithRelationInput[] {
  if (sort === "subject") {
    return [{ subject: "asc" }, { id: "asc" }];
  }
  if (sort === "priority") {
    return [{ priorityRank: "asc" }, { updatedAt: "desc" }, { id: "desc" }];
  }
  return [{ updatedAt: "desc" }, { id: "desc" }];
}

function toRow(request: Prisma.ServiceRequestGetPayload<{ select: typeof rowSelect }>): ServiceRequestRow {
  return {
    id: request.id,
    publicId: request.publicId,
    subject: request.subject,
    requesterName: request.requester.name,
    category: request.category,
    priority: request.priority,
    status: request.status,
    assigneeName: request.assignee?.name ?? null,
    updatedAt: request.updatedAt.toISOString(),
  };
}

async function loadFacets(
  roleWhere: Prisma.ServiceRequestWhereInput,
): Promise<ServiceRequestFacets> {
  const [statusGroups, categoryGroups, priorityGroups, assignees] =
    await Promise.all([
      db.serviceRequest.groupBy({ by: ["status"], where: roleWhere }),
      db.serviceRequest.groupBy({ by: ["category"], where: roleWhere }),
      db.serviceRequest.groupBy({ by: ["priority"], where: roleWhere }),
      db.user.findMany({
        where: { assignedServices: { some: roleWhere } },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
    ]);

  return {
    statuses: statusGroups.map((row) => row.status).sort(),
    categories: categoryGroups.map((row) => row.category).sort(),
    priorities: priorityGroups.map((row) => row.priority).sort(),
    assignees: [...new Set(assignees.map((row) => row.name))],
  };
}

export async function getServiceRequestsList(
  actor: AccessActor,
  query: ServiceRequestListQuery = {},
  signal?: AbortSignal,
): Promise<ServiceRequestsListResult> {
  throwIfAborted(signal);

  const roleWhere: Prisma.ServiceRequestWhereInput =
    serviceRequestWhereForRole(actor);
  const filterParts = buildFilterWhere(query);
  // Role scope never drops resolved/closed; only explicit query.status filters by status.
  const where: Prisma.ServiceRequestWhereInput =
    filterParts.length > 0 ? { AND: [roleWhere, ...filterParts] } : roleWhere;

  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const requestedPage = Math.max(1, query.page ?? 1);
  const orderBy = orderByFor(query.sort);

  const fetchPage = (page: number) =>
    db.serviceRequest.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: rowSelect,
    });

  const [total, firstAttempt, facets] = await Promise.all([
    db.serviceRequest.count({ where }),
    fetchPage(requestedPage),
    loadFacets(roleWhere),
  ]);

  throwIfAborted(signal);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const records =
    page === requestedPage ? firstAttempt : await fetchPage(page);

  throwIfAborted(signal);

  return {
    rows: records.map(toRow),
    total,
    page,
    pageSize,
    pageCount,
    facets,
    query: {
      q: query.q,
      status: query.status,
      category: query.category,
      priority: query.priority,
      assignee: query.assignee,
      sort: query.sort ?? "updated",
      page,
      pageSize,
    },
  };
}
