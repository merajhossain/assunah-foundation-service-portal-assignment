"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { isAbortedError, isApiRequestError, useAbortableRequest } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format/date";
import type { ServiceRequestActivity } from "@/lib/services/service-request-detail";
import { fetchServiceRequestActivities } from "@/lib/services/service-request-detail-client";
import { formatLabel } from "./RequestBadges";

type RequestActivityTreeProps = {
  publicId: string;
  locale: string;
  initialActivities: ServiceRequestActivity[];
  initialNextCursor: number | null;
  total: number;
  labels: {
    title: string;
    empty: string;
    actionTitles: Record<string, string>;
    actionDetails: {
      created: string;
      assigned: string;
    };
    statusLabels: Record<string, string>;
  };
};

export function RequestActivityTree({
  publicId,
  locale,
  initialActivities,
  initialNextCursor,
  total,
  labels,
}: RequestActivityTreeProps) {
  const t = useTranslations("RequestDetail");
  const abortable = useAbortableRequest();
  const [activities, setActivities] = useState(initialActivities);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!nextCursor || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const page = await fetchServiceRequestActivities(publicId, nextCursor, {
        signal: abortable.nextSignal(),
      });
      setActivities((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.activities.filter((item) => !seen.has(item.id))];
      });
      setNextCursor(page.nextCursor);
    } catch (loadError) {
      if (isAbortedError(loadError)) {
        return;
      }
      setError(
        isApiRequestError(loadError) ? loadError.message : t("loadMoreError"),
      );
    } finally {
      setLoading(false);
    }
  }

  function activityDetail(activity: ServiceRequestActivity) {
    if (activity.note) {
      return activity.note;
    }

    if (activity.action === "status_changed" && activity.toValue) {
      return t("detailStatusChanged", {
        status: formatLabel(activity.toValue, labels.statusLabels),
      });
    }

    if (activity.action === "assigned") {
      return labels.actionDetails.assigned;
    }

    if (activity.action === "created") {
      return labels.actionDetails.created;
    }

    if (activity.action === "priority_changed" && activity.toValue) {
      return t("detailPriorityChanged", {
        priority: formatLabel(activity.toValue),
      });
    }

    return formatLabel(activity.action);
  }

  return (
    <section
      aria-labelledby="activity-heading"
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="activity-heading" className="text-lg font-semibold text-ink">
          {labels.title}
        </h2>
        {total > 0 ? (
          <p className="text-xs text-muted" aria-live="polite">
            {t("activityCount", {
              shown: formatNumber(activities.length, locale),
              total: formatNumber(total, locale),
            })}
          </p>
        ) : null}
      </div>

      {activities.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{labels.empty}</p>
      ) : (
        <ol className="relative mt-5 ml-2 border-l-2 border-brand/30 pl-6">
          {activities.map((activity) => (
            <li key={activity.id} className="relative pb-6 last:pb-0">
              <span
                aria-hidden="true"
                className="absolute -left-[1.7rem] top-1.5 h-3 w-3 rounded-full bg-brand ring-4 ring-white"
              />
              <p className="text-sm font-semibold text-ink">
                {labels.actionTitles[activity.action] ??
                  formatLabel(activity.action)}
              </p>
              <p className="mt-0.5 text-sm break-words text-ink/80">
                {activityDetail(activity)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {activity.actorName} ·{" "}
                <time dateTime={activity.createdAt}>
                  {formatDateTime(activity.createdAt, locale)}
                </time>
              </p>
            </li>
          ))}
        </ol>
      )}

      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {nextCursor ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mt-5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
        >
          {loading ? t("loadingMore") : t("loadMore")}
        </button>
      ) : null}
    </section>
  );
}
