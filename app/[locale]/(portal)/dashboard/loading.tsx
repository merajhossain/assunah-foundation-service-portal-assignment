import { getTranslations } from "next-intl/server";
import { DashboardSkeleton } from "@/components/Skeleton";

export default async function DashboardLoading() {
  const t = await getTranslations("Loading");
  return <DashboardSkeleton label={t("title")} />;
}
