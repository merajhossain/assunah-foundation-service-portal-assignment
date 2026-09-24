import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format/date";
import type { OfficerLoadRow } from "@/lib/services/service-request-detail";

export type OfficerLoadLabels = {
  title: string;
  officer: string;
  assigned: string;
  resolved: string;
  avgResolution: string;
  empty: string;
};

type OfficerLoadTableProps = {
  rows: OfficerLoadRow[];
  locale: string;
  labels: OfficerLoadLabels;
};

const thClass =
  "px-2 py-2 text-xs font-semibold tracking-wide text-muted uppercase";

export function OfficerLoadTable({ rows, locale, labels }: OfficerLoadTableProps) {
  const t = useTranslations("RequestDetail");

  function avg(row: OfficerLoadRow) {
    return row.avgResolutionHours === null
      ? "—"
      : t("avgHours", { hours: formatNumber(row.avgResolutionHours, locale) });
  }

  return (
    <section
      aria-labelledby="officer-load-heading"
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h2 id="officer-load-heading" className="text-lg font-semibold text-ink">
        {labels.title}
      </h2>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{labels.empty}</p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-gray-100 sm:hidden">
            {rows.map((row) => (
              <li key={row.officerId} className="py-3">
                <p className="font-medium text-ink">{row.officerName}</p>
                <dl className="mt-1 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-muted">{labels.assigned}</dt>
                    <dd className="text-ink">{formatNumber(row.assigned, locale)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{labels.resolved}</dt>
                    <dd className="text-ink">{formatNumber(row.resolved, locale)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{labels.avgResolution}</dt>
                    <dd className="text-ink">{avg(row)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">{labels.title}</caption>
              <thead>
                <tr className="border-b border-gray-200">
                  <th scope="col" className={thClass}>{labels.officer}</th>
                  <th scope="col" className={thClass}>{labels.assigned}</th>
                  <th scope="col" className={thClass}>{labels.resolved}</th>
                  <th scope="col" className={thClass}>{labels.avgResolution}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.officerId}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <th scope="row" className="px-2 py-3 font-medium text-ink">
                      {row.officerName}
                    </th>
                    <td className="px-2 py-3 text-ink">
                      {formatNumber(row.assigned, locale)}
                    </td>
                    <td className="px-2 py-3 text-ink">
                      {formatNumber(row.resolved, locale)}
                    </td>
                    <td className="px-2 py-3 text-ink">{avg(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
