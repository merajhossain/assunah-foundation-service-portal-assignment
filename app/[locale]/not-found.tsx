import { getTranslations } from "next-intl/server";
import { StatusScreen } from "@/components/StatusScreen";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <StatusScreen code="404" title={t("title")} description={t("description")}>
      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        {t("backToLogin")}
      </Link>
    </StatusScreen>
  );
}
