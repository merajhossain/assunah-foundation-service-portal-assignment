"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { isAbortedError, isApiRequestError, useAbortableRequest } from "@/lib/api";
import {
  fetchServiceRequestDetail,
  type ServiceRequestDetail,
} from "@/lib/services/service-request-detail-client";
import { RequestUpdateForm } from "./RequestUpdateForm";

type AssignRequestButtonProps = {
  publicId: string;
  disabled?: boolean;
};

function AssignIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </svg>
  );
}

export function AssignRequestButton({
  publicId,
  disabled = false,
}: AssignRequestButtonProps) {
  const t = useTranslations("Dashboard");
  const detailT = useTranslations("RequestDetail");
  const abortable = useAbortableRequest();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ServiceRequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setDetail(null);

    fetchServiceRequestDetail(publicId, { signal: abortable.nextSignal() })
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
        }
      })
      .catch((error) => {
        if (cancelled || isAbortedError(error)) {
          return;
        }
        setLoadError(
          isApiRequestError(error) ? error.message : t("assignLoadError"),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, publicId, abortable, t]);

  if (disabled) {
    return (
      <span title={t("assignRequestDisabled")} className="inline-flex">
        <button
          type="button"
          disabled
          aria-label={t("assignRequestDisabled")}
          className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-300"
        >
          <AssignIcon />
        </button>
      </span>
    );
  }

  const statusLabels = {
    open: t("statusOpen"),
    in_progress: t("statusInProgress"),
    resolved: t("statusResolved"),
    closed: t("statusClosed"),
  };


  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("assignRequest")}
        title={t("assignRequest")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-ink hover:border-brand hover:bg-gray-50 hover:text-brand"
      >
        <AssignIcon />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-request-title"
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 pt-5 pb-4">
              <div className="min-w-0">
                <h2 id="assign-request-title" className="text-lg font-semibold text-ink">
                  {detailT("updateTitle")}
                </h2>
                {detail ? (
                  <p className="mt-1 text-sm font-medium break-words text-ink">
                    {detail.subject}
                  </p>
                ) : null}
                <p className="mt-0.5 text-sm text-muted">{publicId}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-md px-2 py-1 text-sm text-muted hover:bg-gray-100 hover:text-ink"
              >
                {t("assignClose")}
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5">
            {loading ? (
              <p role="status" className="text-sm text-muted">
                {t("assignLoading")}
              </p>
            ) : loadError ? (
              <p role="alert" className="text-sm text-red-600">
                {loadError}
              </p>
            ) : detail ? (
              <RequestUpdateForm
                embedded
                publicId={detail.publicId}
                updatedAt={detail.updatedAt}
                currentStatus={detail.status}
                currentAssigneeId={detail.assignee?.id ?? null}
                officers={detail.assignableOfficers}
                statusLabels={statusLabels}
                canEditFields={detail.canEditFields}
                requiresNoteOnChange={detail.requiresNoteOnChange}
                onSaved={() => setOpen(false)}
                labels={{
                  title: detailT("updateTitle"),
                  status: detailT("statusField"),
                  assignee: detailT("assignee"),
                  unassigned: t("unassigned"),
                  note: detailT("note"),
                  notePlaceholder: detailT("notePlaceholder"),
                  noteRequired: detailT("noteRequired"),
                  noteTooLong: detailT("noteTooLong"),
                  submit: detailT("submit"),
                  submitting: detailT("submitting"),
                  success: detailT("updateSuccess"),
                  fieldsLocked: detailT("fieldsLocked"),
                  saveError: detailT("saveError"),
                  conflict: detailT("conflict"),
                  reload: detailT("reload"),
                  timeout: detailT("timeout"),
                }}
              />
            ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
