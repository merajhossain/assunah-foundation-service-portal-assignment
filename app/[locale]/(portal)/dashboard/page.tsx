import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { SkeletonBlock } from "@/components/Skeleton";
import {
  DashboardSummaryCards,
  DashboardSummarySkeleton,
} from "@/components/service-requests/DashboardSummaryCards";
import { NewRequestButton } from "@/components/service-requests/NewRequestButton";
import { ServiceRequestsTable } from "@/components/service-requests/ServiceRequestsTable";
import {
  canAssignOnCreate,
  canCreateServiceRequest,
  isAdminRole,
  isRequesterRole,
  isStaffRole,
} from "@/lib/auth/access";
import { getSession, requireActor } from "@/lib/auth/session";
import { parseServiceRequestQuery } from "@/lib/services/service-request-query";
import { getServiceRequestsList } from "@/lib/services/service-requests";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("title") };
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const actor = await requireActor(locale);
  const [resolvedSearchParams, session, t] = await Promise.all([
    searchParams,
    getSession(),
    getTranslations("Dashboard"),
  ]);
  const user = session?.user;

  const query = parseServiceRequestQuery(resolvedSearchParams);
  const { rows, facets, total, page, pageSize, pageCount } =
    await getServiceRequestsList(actor, query);
  const showNewRequest = canCreateServiceRequest(actor.role);
  const canAssign = canAssignOnCreate(actor.role);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("welcome", { name: user?.name ?? "" })}
          </p>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        {showNewRequest ? (
          <NewRequestButton
            label={t("newRequest")}
            canAssign={canAssign}
            priorityLabels={{
              low: t("priorityLow"),
              medium: t("priorityMedium"),
              high: t("priorityHigh"),
              urgent: t("priorityUrgent"),
            }}
          />
        ) : null}
      </div>

      <div className="mt-6">
        <Suspense fallback={<DashboardSummarySkeleton />}>
          <DashboardSummaryCards
            actor={actor}
            locale={locale}
            labels={{
              region: t("summaryRegion"),
              total: t("summaryTotal"),
              open: t("statusOpen"),
              inProgress: t("statusInProgress"),
              solved: t("summarySolved"),
              urgent: t("priorityUrgent"),
            }}
          />
        </Suspense>
      </div>

      <section className="mt-6">
        <Suspense
          fallback={<SkeletonBlock className="h-96 w-full rounded-xl" />}
        >
          <ServiceRequestsTable
            rows={rows}
            total={total}
            page={page}
            pageSize={pageSize}
            pageCount={pageCount}
            facets={facets}
            locale={locale}
            canEditOwnRequests={isRequesterRole(actor.role)}
            canAssignRequests={isStaffRole(actor.role)}
            canAssignSolved={isAdminRole(actor.role)}
            labels={{
              searchPlaceholder: t("searchPlaceholder"),
              allStatuses: t("allStatuses"),
              allCategories: t("allCategories"),
              allPriorities: t("allPriorities"),
              allAssignees: t("allAssignees"),
              unassigned: t("unassigned"),
              sortUpdated: t("sortUpdated"),
              sortPriority: t("sortPriority"),
              sortSubject: t("sortSubject"),
              clearFilters: t("clearFilters"),
              id: t("colId"),
              subject: t("colSubject"),
              requester: t("colRequester"),
              category: t("colCategory"),
              priority: t("colPriority"),
              status: t("colStatus"),
              assignee: t("colAssignee"),
              updated: t("colUpdated"),
              rowsPerPage: t("rowsPerPage"),
              previous: t("previous"),
              next: t("next"),
              empty: t("empty"),
              edit: t("editRequest"),
              editDisabled: t("editRequestDisabled"),
              statusLabels: {
                open: t("statusOpen"),
                in_progress: t("statusInProgress"),
                resolved: t("statusResolved"),
                closed: t("statusClosed"),
              },
              priorityLabels: {
                low: t("priorityLow"),
                medium: t("priorityMedium"),
                high: t("priorityHigh"),
                urgent: t("priorityUrgent"),
              },
              categoryLabels: {
                education: t("catEducation"),
                skill_development: t("catSkillDevelopment"),
                healthcare: t("catHealthcare"),
                emergency_relief: t("catEmergencyRelief"),
                food: t("catFood"),
                winter: t("catWinter"),
                wash: t("catWash"),
                shelter: t("catShelter"),
                livelihood: t("catLivelihood"),
                dawah: t("catDawah"),
                environment: t("catEnvironment"),
                internal_support: t("catInternalSupport"),
              },
            }}
          />
        </Suspense>
      </section>
    </div>
  );
}
