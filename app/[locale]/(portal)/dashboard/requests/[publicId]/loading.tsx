import { getTranslations } from "next-intl/server";
import { RequestDetailSkeleton } from "@/components/Skeleton";

export default async function RequestDetailLoading() {
  const t = await getTranslations("Loading");
  return <RequestDetailSkeleton label={t("title")} />;
}
