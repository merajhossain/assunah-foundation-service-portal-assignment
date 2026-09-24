"use client";

import { ErrorMessage, Field, Form, Formik, type FormikHelpers } from "formik";
import { useMemo, useState } from "react";
import * as Yup from "yup";
import { useRouter } from "@/i18n/navigation";
import { isAbortedError, isApiRequestError, useAbortableRequest } from "@/lib/api";
import type { AssignableOfficer } from "@/lib/services/service-request-detail";
import { updateServiceRequestRequest } from "@/lib/services/service-request-detail-client";
import {
  SERVICE_REQUEST_STATUSES,
  type ServiceRequestStatus,
} from "@/lib/services/service-request-status";
import { toast } from "sonner";
import { formatLabel } from "./RequestBadges";

export type RequestUpdateFormLabels = {
  title: string;
  status: string;
  assignee: string;
  unassigned: string;
  note: string;
  notePlaceholder: string;
  noteRequired: string;
  noteTooLong: string;
  submit: string;
  submitting: string;
  success: string;
  fieldsLocked: string;
  saveError: string;
  conflict: string;
  reload: string;
  timeout: string;
};

type RequestUpdateFormProps = {
  publicId: string;
  /** Last `updatedAt` seen by the user; sent back for optimistic locking. */
  updatedAt: string;
  currentStatus: string;
  currentAssigneeId: number | null;
  officers: AssignableOfficer[];
  statusLabels: Record<string, string>;
  canEditFields: boolean;
  requiresNoteOnChange: boolean;
  labels: RequestUpdateFormLabels;
  onSaved?: () => void;
  /** Drops the card frame and heading when the form sits inside another dialog. */
  embedded?: boolean;
};

type UpdateValues = {
  status: string;
  assigneeId: string;
  note: string;
};

type Feedback =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }
  | { kind: "conflict"; message: string };

const controlClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:bg-gray-50 disabled:opacity-70";

export function RequestUpdateForm({
  publicId,
  updatedAt,
  currentStatus,
  currentAssigneeId,
  officers,
  statusLabels,
  canEditFields,
  requiresNoteOnChange,
  labels,
  onSaved,
  embedded = false,
}: RequestUpdateFormProps) {
  const router = useRouter();
  const abortable = useAbortableRequest();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const currentAssignee = currentAssigneeId ? String(currentAssigneeId) : "";

  const initialValues = useMemo<UpdateValues>(
    () => ({ status: currentStatus, assigneeId: currentAssignee, note: "" }),
    [currentStatus, currentAssignee],
  );

  const isDirty = (values: Pick<UpdateValues, "status" | "assigneeId">) =>
    values.status !== currentStatus || values.assigneeId !== currentAssignee;

  const schema = useMemo(
    () =>
      Yup.object({
        status: Yup.string()
          .oneOf([...SERVICE_REQUEST_STATUSES])
          .required(),
        assigneeId: Yup.string().default(""),
        note: Yup.string()
          .trim()
          .max(1000, labels.noteTooLong)
          .when(["status", "assigneeId"], {
            is: (status: string, assigneeId: string | undefined) =>
              requiresNoteOnChange &&
              (status !== currentStatus || (assigneeId ?? "") !== currentAssignee),
            then: (field) => field.required(labels.noteRequired),
          }),
      }),
    [
      currentStatus,
      currentAssignee,
      requiresNoteOnChange,
      labels.noteRequired,
      labels.noteTooLong,
    ],
  );

  async function handleSubmit(
    values: UpdateValues,
    helpers: FormikHelpers<UpdateValues>,
  ) {
    if (!canEditFields || !isDirty(values)) {
      return;
    }

    setFeedback(null);
    try {
      await updateServiceRequestRequest(
        publicId,
        {
          status: values.status as ServiceRequestStatus,
          assigneeId: values.assigneeId ? Number(values.assigneeId) : null,
          note: values.note.trim() || undefined,
          expectedUpdatedAt: updatedAt,
        },
        { signal: abortable.nextSignal() },
      );
      toast.success(labels.success);
      setFeedback({ kind: "success", message: labels.success });
      helpers.setFieldValue("note", "", false);
      router.refresh();
      onSaved?.();
    } catch (error) {
      if (isAbortedError(error)) {
        return;
      }
      if (isApiRequestError(error) && error.code === "CONFLICT") {
        setFeedback({ kind: "conflict", message: labels.conflict });
        return;
      }
      const message =
        isApiRequestError(error) && error.code === "REQUEST_TIMEOUT"
          ? labels.timeout
          : isApiRequestError(error)
            ? error.message
            : labels.saveError;
      toast.error(message);
      setFeedback({ kind: "error", message });
    } finally {
      helpers.setSubmitting(false);
    }
  }

  const form = (

      <Formik
        initialValues={initialValues}
        validationSchema={schema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ values, isSubmitting, errors, touched }) => {
          const dirty = canEditFields && isDirty(values);
          const noteRequired = requiresNoteOnChange && dirty;
          const noteInvalid = Boolean(touched.note && errors.note);

          return (
            <Form className={embedded ? "space-y-4" : "mt-4 space-y-4"} noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="update-status"
                  className="block text-sm font-medium text-ink"
                >
                  {labels.status}
                </label>
                <Field
                  as="select"
                  id="update-status"
                  name="status"
                  disabled={!canEditFields || isSubmitting}
                  aria-describedby={!canEditFields ? "update-locked-hint" : undefined}
                  className={controlClass}
                >
                  {SERVICE_REQUEST_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {formatLabel(value, statusLabels)}
                    </option>
                  ))}
                </Field>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="update-assignee"
                  className="block text-sm font-medium text-ink"
                >
                  {labels.assignee}
                </label>
                <Field
                  as="select"
                  id="update-assignee"
                  name="assigneeId"
                  disabled={!canEditFields || isSubmitting}
                  aria-describedby={!canEditFields ? "update-locked-hint" : undefined}
                  className={controlClass}
                >
                  <option value="">{labels.unassigned}</option>
                  {officers.map((officer) => (
                    <option key={officer.id} value={String(officer.id)}>
                      {officer.name}
                    </option>
                  ))}
                </Field>
              </div>

              {!canEditFields ? (
                <p id="update-locked-hint" className="text-xs text-muted">
                  {labels.fieldsLocked}
                </p>
              ) : null}

              {canEditFields && requiresNoteOnChange ? (
                <div className="space-y-1.5">
                  <label
                    htmlFor="update-note"
                    className="block text-sm font-medium text-ink"
                  >
                    {labels.note}
                    {noteRequired ? (
                      <span className="text-brand" aria-hidden="true">
                        {" "}
                        *
                      </span>
                    ) : null}
                  </label>
                  <Field
                    as="textarea"
                    id="update-note"
                    name="note"
                    rows={3}
                    maxLength={1000}
                    placeholder={labels.notePlaceholder}
                    aria-required={noteRequired}
                    aria-invalid={noteInvalid}
                    aria-describedby="update-note-hint update-note-error"
                    className={controlClass}
                  />
                  {noteRequired ? (
                    <p id="update-note-hint" className="text-xs text-muted">
                      {labels.noteRequired}
                    </p>
                  ) : null}
                  <ErrorMessage
                    name="note"
                    render={(message) => (
                      <p id="update-note-error" className="text-sm text-red-600">
                        {message}
                      </p>
                    )}
                  />
                </div>
              ) : null}

              <div aria-live="polite">
                {feedback?.kind === "success" ? (
                  <p role="status" className="text-sm text-green-700">
                    {feedback.message}
                  </p>
                ) : null}
                {feedback?.kind === "error" ? (
                  <p role="alert" className="text-sm text-red-600">
                    {feedback.message}
                  </p>
                ) : null}
                {feedback?.kind === "conflict" ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
                  >
                    <p>{feedback.message}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFeedback(null);
                        router.refresh();
                      }}
                      className="mt-2 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium"
                    >
                      {labels.reload}
                    </button>
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !dirty}
                aria-disabled={isSubmitting || !dirty}
                className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {isSubmitting ? labels.submitting : labels.submit}
              </button>
            </Form>
          );
        }}
      </Formik>
  );

  if (embedded) {
    return form;
  }

  return (
    <section
      aria-labelledby="update-request-heading"
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h2 id="update-request-heading" className="text-lg font-semibold text-ink">
        {labels.title}
      </h2>
      {form}
    </section>
  );
}
