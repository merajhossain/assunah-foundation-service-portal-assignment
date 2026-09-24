import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  OfficerLoadSection,
  OfficerLoadSkeleton,
} from "@/components/service-requests/OfficerLoadSection";
import { RequestDetailView } from "@/components/service-requests/RequestDetailView";
import { ApiError } from "@/lib/api";
import { requireActor } from "@/lib/auth/session";
import { getServiceRequestDetail } from "@/lib/services/service-request-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; publicId: string }>;
}) {
  const { locale, publicId } = await params;
  const t = await getTranslations({ locale, namespace: "RequestDetail" });
  return { title: `${t("title")} · ${decodeURIComponent(publicId)}` };
}

export default async function ServiceRequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; publicId: string }>;
}) {
  const { locale, publicId } = await params;
  const actor = await requireActor(locale);
  const [t, td] = await Promise.all([
    getTranslations("RequestDetail"),
    getTranslations("Dashboard"),
  ]);

  let detail;
  try {
    detail = await getServiceRequestDetail(actor, decodeURIComponent(publicId));
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const officerLoadLabels = {
    title: t("officerLoadTitle"),
    officer: t("officer"),
    assigned: t("assignedCount"),
    resolved: t("resolvedCount"),
    avgResolution: t("avgResolution"),
    empty: t("officerLoadEmpty"),
  };

  return (
    <RequestDetailView
      detail={detail}
      locale={locale}
      officerLoadSlot={
        <Suspense
          fallback={<OfficerLoadSkeleton title={officerLoadLabels.title} />}
        >
          <OfficerLoadSection
            requestId={detail.id}
            locale={locale}
            labels={officerLoadLabels}
          />
        </Suspense>
      }
      labels={{
        back: t("back"),
        edit: t("edit"),
        editDisabled: t("editDisabled"),
        requestInfo: t("requestInfo"),
        service: t("service"),
        requester: t("requester"),
        assignee: t("assignee"),
        unassigned: td("unassigned"),
        category: t("category"),
        created: t("created"),
        updated: t("updated"),
        activityTitle: t("activityTitle"),
        activityEmpty: t("activityEmpty"),
        update: {
          title: t("updateTitle"),
          status: t("statusField"),
          note: t("note"),
          notePlaceholder: t("notePlaceholder"),
          noteRequired: t("noteRequired"),
          noteTooLong: t("noteTooLong"),
          submit: t("submit"),
          submitting: t("submitting"),
          success: t("updateSuccess"),
          fieldsLocked: t("fieldsLocked"),
          saveError: t("saveError"),
          conflict: t("conflict"),
          reload: t("reload"),
          timeout: t("timeout"),
        },
        actionTitles: {
          created: t("actionCreated"),
          assigned: t("actionAssigned"),
          status_changed: t("actionStatusChanged"),
          priority_changed: t("actionPriorityChanged"),
          subject_changed: t("actionSubjectChanged"),
          description_changed: t("actionDescriptionChanged"),
          service_changed: t("actionServiceChanged"),
        },
        actionDetails: {
          created: t("detailCreated"),
          assigned: t("detailAssigned"),
        },
        statusLabels: {
          open: td("statusOpen"),
          in_progress: td("statusInProgress"),
          resolved: td("statusResolved"),
          closed: td("statusClosed"),
        },
        priorityLabels: {
          low: td("priorityLow"),
          medium: td("priorityMedium"),
          high: td("priorityHigh"),
          urgent: td("priorityUrgent"),
        },
        categoryLabels: {
          education: td("catEducation"),
          skill_development: td("catSkillDevelopment"),
          healthcare: td("catHealthcare"),
          emergency_relief: td("catEmergencyRelief"),
          food: td("catFood"),
          winter: td("catWinter"),
          wash: td("catWash"),
          shelter: td("catShelter"),
          livelihood: td("catLivelihood"),
          dawah: td("catDawah"),
          environment: td("catEnvironment"),
          internal_support: td("catInternalSupport"),
        },
      }}
    />
  );
}
