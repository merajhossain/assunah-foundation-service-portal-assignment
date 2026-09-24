import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { formatDateTime } from "@/lib/format/date";
import type { ServiceRequestDetail } from "@/lib/services/service-request-detail";
import { RequestActivityTree } from "./RequestActivityTree";
import {
  PriorityBadge,
  StatusBadge,
  formatLabel,
} from "./RequestBadges";
import { RequesterEditButton } from "./RequesterEditButton";
import { RequestUpdateForm, type RequestUpdateFormLabels } from "./RequestUpdateForm";

type RequestDetailViewProps = {
  detail: ServiceRequestDetail;
  locale: string;
  /** Streamed officer-load section (wrapped in `<Suspense>` by the page). */
  officerLoadSlot: ReactNode;
  labels: {
    back: string;
    edit: string;
    editDisabled: string;
    requestInfo: string;
    service: string;
    requester: string;
    assignee: string;
    unassigned: string;
    category: string;
    created: string;
    updated: string;
    activityTitle: string;
    activityEmpty: string;
    update: Omit<RequestUpdateFormLabels, "assignee" | "unassigned">;
    actionTitles: Record<string, string>;
    actionDetails: {
      created: string;
      assigned: string;
    };
    statusLabels: Record<string, string>;
    priorityLabels: Record<string, string>;
    categoryLabels: Record<string, string>;
  };
};

function Field({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
        {term}
      </dt>
      <dd className="mt-1 text-sm break-words text-ink">{children}</dd>
    </div>
  );
}

export function RequestDetailView({
  detail,
  locale,
  officerLoadSlot,
  labels,
}: RequestDetailViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-brand hover:underline"
        >
          {labels.back}
        </Link>

        <p className="mt-4 text-sm font-medium text-muted">{detail.publicId}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold break-words text-ink sm:text-3xl">
          {detail.subject}{" "}
          <span className="font-normal text-muted">#{detail.id}</span>
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge
            status={detail.status}
            label={formatLabel(detail.status, labels.statusLabels)}
          />
          <PriorityBadge
            priority={detail.priority}
            label={formatLabel(detail.priority, labels.priorityLabels)}
          />
          {detail.showRequesterEdit ? (
            <RequesterEditButton
              publicId={detail.publicId}
              label={labels.edit}
              priorityLabels={labels.priorityLabels}
              disabled={!detail.canRequesterEdit}
              disabledTooltip={labels.editDisabled}
            />
          ) : null}
        </div>
      </div>

      <div
        className={`grid gap-6 ${
          detail.canUpdate
            ? "lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]"
            : ""
        }`}
      >
        <div className="min-w-0 space-y-6">
          <section
            aria-label={labels.requestInfo}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field term={labels.requester}>
                {detail.requester.name}
                <span className="text-muted"> · {detail.requester.email}</span>
              </Field>
              <Field term={labels.assignee}>
                {detail.assignee?.name ?? labels.unassigned}
              </Field>
              <Field term={labels.category}>
                {formatLabel(detail.category, labels.categoryLabels)}
              </Field>
              <Field term={labels.service}>{detail.service.name}</Field>
              <Field term={labels.created}>
                <time dateTime={detail.createdAt}>
                  {formatDateTime(detail.createdAt, locale)}
                </time>
              </Field>
              <Field term={labels.updated}>
                <time dateTime={detail.updatedAt}>
                  {formatDateTime(detail.updatedAt, locale)}
                </time>
              </Field>
            </dl>
            <p className="mt-5 border-t border-gray-100 pt-4 text-sm leading-relaxed whitespace-pre-line break-words text-ink/90">
              {detail.description}
            </p>
          </section>

          <RequestActivityTree
            key={detail.updatedAt}
            publicId={detail.publicId}
            locale={locale}
            initialActivities={detail.activities}
            initialNextCursor={detail.activitiesNextCursor}
            total={detail.activitiesTotal}
            labels={{
              title: labels.activityTitle,
              empty: labels.activityEmpty,
              actionTitles: labels.actionTitles,
              actionDetails: labels.actionDetails,
              statusLabels: labels.statusLabels,
            }}
          />

          {officerLoadSlot}
        </div>

        {detail.canUpdate ? (
          <div className="lg:sticky lg:top-6 lg:self-start">
            <RequestUpdateForm
              publicId={detail.publicId}
              updatedAt={detail.updatedAt}
              currentStatus={detail.status}
              currentAssigneeId={detail.assignee?.id ?? null}
              officers={detail.assignableOfficers}
              statusLabels={labels.statusLabels}
              canEditFields={detail.canEditFields}
              requiresNoteOnChange={detail.requiresNoteOnChange}
              labels={{
                ...labels.update,
                assignee: labels.assignee,
                unassigned: labels.unassigned,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
