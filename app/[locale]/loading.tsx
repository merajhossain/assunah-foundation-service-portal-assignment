import { getTranslations } from "next-intl/server";
import { StatusScreen } from "@/components/StatusScreen";

export default async function Loading() {
  const t = await getTranslations("Loading");

  return (
    <StatusScreen
      title={t("title")}
      description={t("description")}
      leading={
        <div
          className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand"
          role="status"
          aria-label={t("title")}
        />
      }
    />
  );
}
