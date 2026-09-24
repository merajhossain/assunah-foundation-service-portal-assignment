import { getOfficerLoad } from "@/lib/services/service-request-detail";
import { OfficerLoadTable, type OfficerLoadLabels } from "./OfficerLoadTable";

type OfficerLoadSectionProps = {
  requestId: number;
  locale: string;
  labels: OfficerLoadLabels;
};

/** Streams in after the rest of the detail page via `<Suspense>`. */
export async function OfficerLoadSection({
  requestId,
  locale,
  labels,
}: OfficerLoadSectionProps) {
  const rows = await getOfficerLoad(requestId);
  return <OfficerLoadTable rows={rows} locale={locale} labels={labels} />;
}

export function OfficerLoadSkeleton({ title }: { title: string }) {
  return (
    <section
      aria-busy="true"
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4 space-y-3 animate-pulse">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-5 rounded bg-gray-100" />
        ))}
      </div>
    </section>
  );
}
