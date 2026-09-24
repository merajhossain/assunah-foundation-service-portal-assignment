"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { StatusScreen } from "@/components/StatusScreen";
import { Link } from "@/i18n/navigation";

export default function Error({
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
    <StatusScreen code="500" title={t("title")} description={t("description")}>
      <div className="space-y-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex w-full items-center justify-center rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {t("retry")}
        </button>
        <Link href="/login" className="text-sm text-brand hover:underline">
          {t("backToLogin")}
        </Link>
        {error.digest ? (
          <p className="text-xs text-muted">
            {t("reference")}: {error.digest}
          </p>
        ) : null}
      </div>
    </StatusScreen>
  );
}
