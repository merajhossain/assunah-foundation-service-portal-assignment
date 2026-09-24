import { SkeletonBlock } from "@/components/Skeleton";
import type { AccessActor } from "@/lib/auth/access";
import { formatNumber } from "@/lib/format/date";
import { getDashboardSummary } from "@/lib/services/dashboard";

type SummaryLabels = {
  region: string;
  total: string;
  open: string;
  inProgress: string;
  solved: string;
  urgent: string;
};

type DashboardSummaryCardsProps = {
  actor: AccessActor;
  locale: string;
  labels: SummaryLabels;
};

/** Streams in via `<Suspense>` so the request table is not blocked by the counts. */
export async function DashboardSummaryCards({
  actor,
  locale,
  labels,
}: DashboardSummaryCardsProps) {
  const { requests } = await getDashboardSummary(actor);

  const cards = [
    { label: labels.total, value: requests.total },
    { label: labels.open, value: requests.open },
    { label: labels.inProgress, value: requests.inProgress },
    { label: labels.solved, value: requests.resolved + requests.closed },
    { label: labels.urgent, value: requests.urgent },
  ];

  return (
    <section aria-label={labels.region}>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
          >
            <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
              {card.label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-ink">
              {formatNumber(card.value, locale)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function DashboardSummarySkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {[0, 1, 2, 3, 4].map((key) => (
        <SkeletonBlock key={key} className="h-[74px] rounded-xl" />
      ))}
    </div>
  );
}
