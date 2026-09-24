"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  createColumnHelper,
  rowPaginationFeature,
  tableFeatures,
  useTable,
  type PaginationState,
  type Updater,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { formatDateTime, formatNumber } from "@/lib/format/date";
import type { ServiceRequestListQuery } from "@/lib/services/service-request-query";
import {
  PAGE_SIZE_OPTIONS,
  UNASSIGNED_ASSIGNEE,
  hasServiceRequestFilters,
  parseServiceRequestQuery,
  toServiceRequestSearchParams,
} from "@/lib/services/service-request-query";
import type {
  ServiceRequestFacets,
  ServiceRequestRow,
} from "@/lib/services/service-requests";
import { PriorityBadge, StatusBadge, formatLabel } from "./RequestBadges";
import { AssignRequestButton } from "./AssignRequestButton";
import { RequesterEditButton } from "./RequesterEditButton";

type Labels = {
  searchPlaceholder: string;
  allStatuses: string;
  allCategories: string;
  allPriorities: string;
  allAssignees: string;
  unassigned: string;
  sortUpdated: string;
  sortPriority: string;
  sortSubject: string;
  clearFilters: string;
  id: string;
  subject: string;
  requester: string;
  category: string;
  priority: string;
  status: string;
  assignee: string;
  updated: string;
  rowsPerPage: string;
  previous: string;
  next: string;
  empty: string;
  edit: string;
  editDisabled: string;
  statusLabels: Record<string, string>;
  priorityLabels: Record<string, string>;
  categoryLabels: Record<string, string>;
};

type ServiceRequestsTableProps = {
  rows: ServiceRequestRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  facets: ServiceRequestFacets;
  locale: string;
  labels: Labels;
  /** Requesters can edit their own requests until they are resolved or closed. */
  canEditOwnRequests?: boolean;
  /** Admin, manager, and office can assign from the list. Admins may assign solved requests. */
  canAssignRequests?: boolean;
  canAssignSolved?: boolean;
};

type SortKey = NonNullable<ServiceRequestListQuery["sort"]>;

const features = tableFeatures({ rowPaginationFeature });

const columnHelper = createColumnHelper<typeof features, ServiceRequestRow>();

const selectClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink sm:w-auto";

function requestHref(publicId: string) {
  return `/dashboard/requests/${encodeURIComponent(publicId)}`;
}

function pageNumberWindow(current: number, total: number, span = 2) {
  if (total <= 1) {
    return [0];
  }

  const pages = new Set<number>();
  pages.add(0);
  pages.add(total - 1);

  for (let i = current - span; i <= current + span; i += 1) {
    if (i >= 0 && i < total) {
      pages.add(i);
    }
  }

  return [...pages].sort((a, b) => a - b);
}

export function ServiceRequestsTable({
  rows,
  total,
  page,
  pageSize,
  pageCount,
  facets,
  locale,
  labels,
  canEditOwnRequests = false,
  canAssignRequests = false,
  canAssignSolved = false,
}: ServiceRequestsTableProps) {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const query = useMemo(
    () => parseServiceRequestQuery(searchParams),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(query.q ?? "");
  const [syncedQ, setSyncedQ] = useState(query.q);

  if (query.q !== syncedQ) {
    setSyncedQ(query.q);
    setSearchInput(query.q ?? "");
  }

  function replaceQuery(nextQuery: ServiceRequestListQuery) {
    const params = toServiceRequestSearchParams(nextQuery);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  /** Any change other than an explicit page change sends the user back to page 1. */
  function patchQuery(patch: Partial<ServiceRequestListQuery>) {
    const next: ServiceRequestListQuery = { ...query, page: undefined };
    for (const [key, value] of Object.entries(patch)) {
      (next as Record<string, unknown>)[key] = value === "" ? undefined : value;
    }
    replaceQuery(next);
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = searchInput.trim();
      const current = query.q ?? "";
      if (next === current) {
        return;
      }
      patchQuery({ q: next || undefined });
    }, 350);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, query.q]);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("publicId", {
          id: "publicId",
          header: labels.id,
          cell: ({ getValue }) => (
            <Link
              href={requestHref(getValue())}
              className="font-medium text-brand hover:underline"
            >
              {getValue()}
            </Link>
          ),
        }),
        columnHelper.accessor("subject", {
          id: "subject",
          header: labels.subject,
          cell: ({ row, getValue }) => (
            <Link
              href={requestHref(row.original.publicId)}
              className="font-medium text-ink hover:text-brand"
            >
              {getValue()}{" "}
              <span className="font-normal text-muted">
                (#{row.original.id})
              </span>
            </Link>
          ),
        }),
        columnHelper.accessor("requesterName", {
          id: "requesterName",
          header: labels.requester,
        }),
        columnHelper.accessor("category", {
          id: "category",
          header: labels.category,
          cell: ({ getValue }) =>
            formatLabel(getValue(), labels.categoryLabels),
        }),
        columnHelper.accessor("priority", {
          id: "priority",
          header: labels.priority,
          cell: ({ getValue }) => (
            <PriorityBadge
              priority={getValue()}
              label={formatLabel(getValue(), labels.priorityLabels)}
            />
          ),
        }),
        columnHelper.accessor("status", {
          id: "status",
          header: labels.status,
          cell: ({ getValue }) => (
            <StatusBadge
              status={getValue()}
              label={formatLabel(getValue(), labels.statusLabels)}
            />
          ),
        }),
        columnHelper.accessor("assigneeName", {
          id: "assigneeName",
          header: labels.assignee,
          cell: ({ getValue }) => getValue() ?? labels.unassigned,
        }),
        columnHelper.accessor("updatedAt", {
          id: "updatedAt",
          header: labels.updated,
          cell: ({ getValue }) => (
            <time dateTime={getValue()}>
              {formatDateTime(getValue(), locale)}
            </time>
          ),
        }),
        ...(canEditOwnRequests
          ? [
              columnHelper.display({
                id: "edit",
                header: () => <span className="sr-only">{labels.edit}</span>,
                cell: ({ row }) => (
                  <RequesterEditButton
                    publicId={row.original.publicId}
                    label={labels.edit}
                    priorityLabels={labels.priorityLabels}
                    disabled={row.original.status !== "open"}
                    disabledTooltip={labels.editDisabled}
                  />
                ),
              }),
            ]
          : []),
        ...(canAssignRequests
          ? [
              columnHelper.display({
                id: "assign",
                header: () => <span className="sr-only">{labels.assignee}</span>,
                cell: ({ row }) => {
                  const solved =
                    row.original.status === "resolved" ||
                    row.original.status === "closed";
                  return (
                    <AssignRequestButton
                      publicId={row.original.publicId}
                      disabled={solved && !canAssignSolved}
                    />
                  );
                },
              }),
            ]
          : []),
      ]),
    [labels, locale, canEditOwnRequests, canAssignRequests, canAssignSolved],
  );

  const pagination: PaginationState = { pageIndex: page - 1, pageSize };

  function onPaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    if (next.pageSize !== pagination.pageSize) {
      patchQuery({ pageSize: next.pageSize });
      return;
    }
    if (next.pageIndex !== pagination.pageIndex) {
      patchQuery({ page: next.pageIndex + 1 });
    }
  }

  const table = useTable(
    {
      features,
      columns,
      data: rows,
      getRowId: (row) => String(row.id),
      manualPagination: true,
      rowCount: total,
      state: { pagination },
      onPaginationChange,
    },
    (state) => ({
      pagination: state.pagination,
    }),
  );

  const pageIndex = page - 1;
  const pageNumbers = pageNumberWindow(pageIndex, pageCount);
  const filtersActive = hasServiceRequestFilters(query);
  const tableRows = table.getRowModel().rows;
  const showingText = t("showing", {
    page: total === 0 ? formatNumber(0, locale) : formatNumber(page, locale),
    pages: formatNumber(total === 0 ? 0 : pageCount, locale),
    total: formatNumber(total, locale),
  });

  return (
    <div className="space-y-4">
      <div role="search" aria-label={t("filtersRegion")} className="space-y-3">
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={labels.searchPlaceholder}
          aria-label={t("searchLabel")}
          maxLength={200}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <select
            value={query.status ?? ""}
            onChange={(event) => patchQuery({ status: event.target.value })}
            aria-label={t("filterStatus")}
            className={selectClass}
          >
            <option value="">{labels.allStatuses}</option>
            {facets.statuses.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value, labels.statusLabels)}
              </option>
            ))}
          </select>

          <select
            value={query.category ?? ""}
            onChange={(event) => patchQuery({ category: event.target.value })}
            aria-label={t("filterCategory")}
            className={selectClass}
          >
            <option value="">{labels.allCategories}</option>
            {facets.categories.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value, labels.categoryLabels)}
              </option>
            ))}
          </select>

          <select
            value={query.priority ?? ""}
            onChange={(event) => patchQuery({ priority: event.target.value })}
            aria-label={t("filterPriority")}
            className={selectClass}
          >
            <option value="">{labels.allPriorities}</option>
            {facets.priorities.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value, labels.priorityLabels)}
              </option>
            ))}
          </select>

          <select
            value={query.assignee ?? ""}
            onChange={(event) => patchQuery({ assignee: event.target.value })}
            aria-label={t("filterAssignee")}
            className={selectClass}
          >
            <option value="">{labels.allAssignees}</option>
            <option value={UNASSIGNED_ASSIGNEE}>{labels.unassigned}</option>
            {facets.assignees.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={(query.sort as SortKey | undefined) ?? "updated"}
            onChange={(event) =>
              patchQuery({ sort: event.target.value as SortKey })
            }
            aria-label={t("sortLabel")}
            className={selectClass}
          >
            <option value="updated">{labels.sortUpdated}</option>
            <option value="subject">{labels.sortSubject}</option>
            <option value="priority">{labels.sortPriority}</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              replaceQuery({});
            }}
            disabled={!filtersActive && !searchInput}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-ink disabled:opacity-40 sm:ml-auto"
          >
            {labels.clearFilters}
          </button>
        </div>
      </div>

      <div
        aria-busy={isPending}
        className={`transition-opacity ${isPending ? "opacity-60" : ""}`}
      >
        {/* Mobile: stacked cards */}
        <ul className="space-y-3 md:hidden">
          {tableRows.length === 0 ? (
            <li className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-muted">
              {labels.empty}
            </li>
          ) : (
            tableRows.map((row) => {
              const item = row.original;
              return (
                <li
                  key={row.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={requestHref(item.publicId)}
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      {item.publicId}
                    </Link>
                    <time
                      dateTime={item.updatedAt}
                      className="shrink-0 text-xs text-muted"
                    >
                      {formatDateTime(item.updatedAt, locale)}
                    </time>
                  </div>
                  <Link
                    href={requestHref(item.publicId)}
                    className="mt-1 block font-medium text-ink hover:text-brand"
                  >
                    {item.subject}
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={item.status}
                      label={formatLabel(item.status, labels.statusLabels)}
                    />
                    <PriorityBadge
                      priority={item.priority}
                      label={formatLabel(item.priority, labels.priorityLabels)}
                    />
                    {canEditOwnRequests ? (
                      <RequesterEditButton
                        publicId={item.publicId}
                        label={labels.edit}
                        priorityLabels={labels.priorityLabels}
                        disabled={item.status !== "open"}
                        disabledTooltip={labels.editDisabled}
                      />
                    ) : null}
                    {canAssignRequests ? (
                      <AssignRequestButton
                        publicId={item.publicId}
                        disabled={
                          (item.status === "resolved" || item.status === "closed") &&
                          !canAssignSolved
                        }
                      />
                    ) : null}
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <dt className="text-muted">{labels.requester}</dt>
                    <dd className="text-ink">{item.requesterName}</dd>
                    <dt className="text-muted">{labels.assignee}</dt>
                    <dd className="text-ink">
                      {item.assigneeName ?? labels.unassigned}
                    </dd>
                    <dt className="text-muted">{labels.category}</dt>
                    <dd className="text-ink">
                      {formatLabel(item.category, labels.categoryLabels)}
                    </dd>
                  </dl>
                </li>
              );
            })
          )}
        </ul>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
          <table className="min-w-full border-collapse text-left text-sm">
            <caption className="sr-only">
              {t("tableCaption", {
                page: formatNumber(page, locale),
                pages: formatNumber(pageCount, locale),
              })}
            </caption>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr
                  key={group.id}
                  className="border-b border-gray-200 bg-gray-50"
                >
                  {group.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase"
                    >
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-muted"
                  >
                    {labels.empty}
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    {row.getAllCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 align-middle text-ink"
                      >
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted" aria-live="polite">
          {showingText}
        </p>

        <nav
          aria-label={t("pagination")}
          className="flex flex-wrap items-center gap-2"
        >
          <label className="flex items-center gap-2 text-sm text-muted">
            <span>{labels.rowsPerPage}</span>
            <select
              value={pageSize}
              onChange={(event) => {
                table.setPageSize(Number(event.target.value));
              }}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-ink"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isPending}
            aria-label={t("previousPage")}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-ink disabled:opacity-40"
          >
            {labels.previous}
          </button>

          <div className="flex items-center gap-1">
            {pageNumbers.map((pageNumber, index) => {
              const prev = pageNumbers[index - 1];
              const showEllipsis = prev !== undefined && pageNumber - prev > 1;
              const current = pageNumber === pageIndex;

              return (
                <span key={pageNumber} className="flex items-center gap-1">
                  {showEllipsis ? (
                    <span className="px-1 text-muted" aria-hidden="true">
                      …
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => table.setPageIndex(pageNumber)}
                    disabled={isPending}
                    aria-current={current ? "page" : undefined}
                    aria-label={t("goToPage", { page: pageNumber + 1 })}
                    className={`min-w-8 rounded-lg border px-2 py-1.5 text-sm ${
                      current
                        ? "border-brand bg-brand text-white"
                        : "border-gray-300 bg-white text-ink"
                    }`}
                  >
                    {formatNumber(pageNumber + 1, locale)}
                  </button>
                </span>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isPending}
            aria-label={t("nextPage")}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-ink disabled:opacity-40"
          >
            {labels.next}
          </button>
        </nav>
      </div>
    </div>
  );
}
