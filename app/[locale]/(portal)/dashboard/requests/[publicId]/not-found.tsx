import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function RequestNotFound() {
  const t = await getTranslations("RequestDetail");

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
      <p className="font-display text-4xl font-semibold text-brand">404</p>
      <h1 className="mt-2 text-xl font-bold text-ink">{t("notFoundTitle")}</h1>
      <p className="mt-3 text-sm text-muted">{t("notFoundDescription")}</p>
      <Link
        href="/dashboard"
        className="mt-6 inline-block text-sm font-medium text-brand hover:underline"
      >
        {t("back")}
      </Link>
    </div>
  );
}
