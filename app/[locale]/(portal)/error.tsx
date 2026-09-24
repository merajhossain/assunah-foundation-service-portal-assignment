"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm"
    >
      <p className="font-display text-4xl font-semibold text-brand">500</p>
      <h1 className="mt-2 text-xl font-bold text-ink">{t("title")}</h1>
      <p className="mt-3 text-sm text-muted">{t("description")}</p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark sm:w-auto"
        >
          {t("retry")}
        </button>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-brand hover:underline"
        >
          {t("backToRequests")}
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-4 text-xs text-muted">
          {t("reference")}: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
