export const SERVICE_REQUEST_SORTS = [
  "updated",
  "subject",
  "priority",
] as const;

export type ServiceRequestSort = (typeof SERVICE_REQUEST_SORTS)[number];

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 20;

export type ServiceRequestListQuery = {
  q?: string;
  status?: string;
  category?: string;
  priority?: string;
  /** Assignee display name, or `"unassigned"`. */
  assignee?: string;
  sort?: ServiceRequestSort;
  /** 1-based page number. */
  page?: number;
  pageSize?: number;
};

export const UNASSIGNED_ASSIGNEE = "unassigned";

function firstParam(
  value: string | string[] | undefined | null,
): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0]?.trim();
    return first || undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  return undefined;
}

function isSort(value: string | undefined): value is ServiceRequestSort {
  return (
    value === "updated" || value === "subject" || value === "priority"
  );
}

function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 1 ? page : undefined;
}

function parsePageSize(value: string | undefined) {
  const size = Number(value);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(size) &&
    size !== DEFAULT_PAGE_SIZE
    ? size
    : undefined;
}

export function parseServiceRequestQuery(
  input:
    | URLSearchParams
    | Record<string, string | string[] | undefined>,
): ServiceRequestListQuery {
  const read = (key: string) => {
    if (input instanceof URLSearchParams) {
      return firstParam(input.get(key));
    }
    return firstParam(input[key]);
  };

  const sortRaw = read("sort");

  return {
    q: read("q")?.slice(0, 200),
    status: read("status"),
    category: read("category"),
    priority: read("priority"),
    assignee: read("assignee"),
    sort: isSort(sortRaw) ? sortRaw : undefined,
    page: parsePage(read("page")),
    pageSize: parsePageSize(read("pageSize")),
  };
}

export function toServiceRequestSearchParams(
  query: ServiceRequestListQuery,
): URLSearchParams {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }
  if (query.status) {
    params.set("status", query.status);
  }
  if (query.category) {
    params.set("category", query.category);
  }
  if (query.priority) {
    params.set("priority", query.priority);
  }
  if (query.assignee) {
    params.set("assignee", query.assignee);
  }
  if (query.sort && query.sort !== "updated") {
    params.set("sort", query.sort);
  }
  if (query.page && query.page > 1) {
    params.set("page", String(query.page));
  }
  if (query.pageSize && query.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(query.pageSize));
  }

  return params;
}

export function hasServiceRequestFilters(query: ServiceRequestListQuery) {
  return Boolean(
    query.q ||
      query.status ||
      query.category ||
      query.priority ||
      query.assignee ||
      (query.sort && query.sort !== "updated"),
  );
}
