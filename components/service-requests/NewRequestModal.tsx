"use client";

import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  type FormikErrors,
  type FormikHelpers,
  type FormikTouched,
} from "formik";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  isAbortedError,
  isApiRequestError,
  useAbortableRequest,
} from "@/lib/api";
import {
  editRequesterServiceRequest,
  fetchServiceRequestDetail,
} from "@/lib/services/service-request-detail-client";
import {
  createServiceRequestRequest,
  fetchCreateServiceRequestOptions,
  type OfficerOption,
  type ServiceOption,
} from "@/lib/services/service-requests-client";
import {
  SERVICE_REQUEST_PRIORITIES,
  type ServiceRequestPriority,
} from "@/lib/services/service-request-status";
import { createServiceRequestSchema } from "@/lib/validations/service-request";
import { toast } from "sonner";
import { formatLabel } from "./RequestBadges";

type CreateValues = {
  subject: string;
  description: string;
  serviceId: string;
  priority: string;
  assigneeId: string;
};

type EditDraft = {
  subject: string;
  description: string;
  serviceId: string;
  priority: string;
  expectedUpdatedAt: string;
};

type NewRequestModalProps = {
  open: boolean;
  onClose: () => void;
  canAssign: boolean;
  priorityLabels: Record<string, string>;
  /** When set, the modal edits this request instead of creating one. */
  editPublicId?: string | null;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand aria-invalid:border-red-500";

function fieldA11y(
  name: keyof CreateValues,
  errors: FormikErrors<CreateValues>,
  touched: FormikTouched<CreateValues>,
  hintId?: string,
) {
  const invalid = Boolean(touched[name] && errors[name]);
  const describedBy = [hintId, invalid ? `${name}-error` : undefined]
    .filter(Boolean)
    .join(" ");
  return {
    "aria-invalid": invalid,
    "aria-describedby": describedBy || undefined,
  };
}

function FieldError({ name }: { name: keyof CreateValues }) {
  return (
    <ErrorMessage
      name={name}
      render={(message) => (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
          {message}
        </p>
      )}
    />
  );
}

export function NewRequestModal({
  open,
  onClose,
  canAssign,
  priorityLabels,
  editPublicId = null,
}: NewRequestModalProps) {
  const t = useTranslations("NewRequest");
  const router = useRouter();
  const abortable = useAbortableRequest();
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [officers, setOfficers] = useState<OfficerOption[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(open);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const editing = Boolean(editPublicId);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setLoadingMeta(true);
      setLoadError(null);
      setFormError(null);
      setEditDraft(null);
    }
  }

  function retryLoadOptions() {
    setLoadingMeta(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const signal = abortable.nextSignal();
    const optionsRequest = fetchCreateServiceRequestOptions({ signal });
    const detailRequest = editPublicId
      ? fetchServiceRequestDetail(editPublicId, { signal })
      : Promise.resolve(null);

    Promise.all([optionsRequest, detailRequest])
      .then(([data, detail]) => {
        if (cancelled) {
          return;
        }
        if (detail && !detail.canRequesterEdit) {
          setLoadError(t("editLocked"));
          return;
        }
        setServices(data.services);
        setOfficers(data.officers);
        if (detail) {
          setEditDraft({
            subject: detail.subject,
            description: detail.description,
            serviceId: String(detail.service.id),
            priority: detail.priority,
            expectedUpdatedAt: detail.updatedAt,
          });
        }
      })
      .catch((error) => {
        if (cancelled || isAbortedError(error)) {
          return;
        }
        setLoadError(
          isApiRequestError(error) && error.code === "REQUEST_TIMEOUT"
            ? t("timeout")
            : t("loadOptionsError"),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingMeta(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, abortable, t, reloadKey, editPublicId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (open && !loadingMeta && !loadError) {
      dialogRef.current?.querySelector<HTMLInputElement>("#subject")?.focus();
    }
  }, [open, loadingMeta, loadError]);

  const initialValues = useMemo<CreateValues>(
    () => ({
      subject: editDraft?.subject ?? "",
      description: editDraft?.description ?? "",
      serviceId: editDraft?.serviceId ?? "",
      priority: editDraft?.priority ?? "medium",
      assigneeId: "",
    }),
    [editDraft],
  );

  if (!open) {
    return null;
  }

  function onDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) {
      return;
    }

    const focusable = [
      ...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ];
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleSubmit(
    values: CreateValues,
    helpers: FormikHelpers<CreateValues>,
  ) {
    setFormError(null);

    try {
      if (editing && editPublicId && editDraft) {
        await editRequesterServiceRequest(
          editPublicId,
          {
            subject: values.subject.trim(),
            description: values.description.trim(),
            serviceId: Number(values.serviceId),
            priority: values.priority as ServiceRequestPriority,
            expectedUpdatedAt: editDraft.expectedUpdatedAt,
          },
          { signal: abortable.nextSignal() },
        );
        toast.success(t("editSuccess"));
        onClose();
        router.refresh();
        return;
      }

      const created = await createServiceRequestRequest(
        {
          subject: values.subject.trim(),
          description: values.description.trim(),
          serviceId: Number(values.serviceId),
          priority: values.priority as ServiceRequestPriority,
          assigneeId: values.assigneeId ? Number(values.assigneeId) : null,
        },
        { signal: abortable.nextSignal() },
      );

      toast.success(t("success"));
      helpers.resetForm();
      onClose();
      router.push(`/dashboard/requests/${encodeURIComponent(created.publicId)}`);
    } catch (error) {
      if (isAbortedError(error)) {
        return;
      }
      setFormError(
        isApiRequestError(error) && error.code === "REQUEST_TIMEOUT"
          ? t("timeout")
          : isApiRequestError(error)
            ? error.message
            : t("submitError"),
      );
    } finally {
      helpers.setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-request-title"
        aria-describedby="new-request-subtitle"
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl border border-gray-200 bg-white shadow-xl outline-none sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 pt-5 pb-4 sm:px-6">
          <div>
            <h2 id="new-request-title" className="text-xl font-semibold text-ink">
              {editing ? t("editTitle") : t("title")}
            </h2>
            <p id="new-request-subtitle" className="mt-1 text-sm text-muted">
              {editing ? t("editSubtitle", { id: editPublicId ?? "" }) : t("subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-muted hover:bg-gray-100 hover:text-ink"
          >
            {t("close")}
          </button>
        </div>

        {loadingMeta ? (
          <p role="status" className="px-5 py-8 text-sm text-muted sm:px-6">
            {t("loading")}
          </p>
        ) : loadError ? (
          <div role="alert" className="space-y-3 px-5 py-8 sm:px-6">
            <p className="text-sm text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={retryLoadOptions}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-gray-50"
            >
              {t("retry")}
            </button>
          </div>
        ) : (
          <Formik
            initialValues={initialValues}
            enableReinitialize
            validateOnBlur={false}
            validateOnChange={false}
            validationSchema={createServiceRequestSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, values, errors, touched, setFieldValue }) => {
              const selectedService = services.find(
                (service) => String(service.id) === values.serviceId,
              );

              return (
                <Form noValidate className="flex min-h-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
                    <div>
                      <label
                        htmlFor="subject"
                        className="mb-1.5 block text-sm font-medium text-ink"
                      >
                        {t("subject")}{" "}
                        <span className="text-brand" aria-hidden="true">*</span>
                      </label>
                      <Field
                        id="subject"
                        name="subject"
                        type="text"
                        maxLength={255}
                        aria-required="true"
                        placeholder={t("subjectPlaceholder")}
                        className={inputClass}
                        {...fieldA11y("subject", errors, touched)}
                      />
                      <FieldError name="subject" />
                    </div>

                    <div>
                      <label
                        htmlFor="description"
                        className="mb-1.5 block text-sm font-medium text-ink"
                      >
                        {t("description")}{" "}
                        <span className="text-brand" aria-hidden="true">*</span>
                      </label>
                      <Field
                        as="textarea"
                        id="description"
                        name="description"
                        rows={4}
                        maxLength={5000}
                        aria-required="true"
                        placeholder={t("descriptionPlaceholder")}
                        className={inputClass}
                        {...fieldA11y("description", errors, touched)}
                      />
                      <FieldError name="description" />
                    </div>

                    <div>
                      <label
                        htmlFor="serviceId"
                        className="mb-1.5 block text-sm font-medium text-ink"
                      >
                        {t("service")}{" "}
                        <span className="text-brand" aria-hidden="true">*</span>
                      </label>
                      <Field
                        as="select"
                        id="serviceId"
                        name="serviceId"
                        aria-required="true"
                        className={inputClass}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                          setFieldValue("serviceId", event.target.value);
                        }}
                        {...fieldA11y(
                          "serviceId",
                          errors,
                          touched,
                          selectedService ? "serviceId-hint" : undefined,
                        )}
                      >
                        <option value="">{t("servicePlaceholder")}</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </Field>
                      {selectedService ? (
                        <p id="serviceId-hint" className="mt-1 text-xs text-muted">
                          {t("categoryHint", {
                            category: formatLabel(selectedService.category),
                          })}
                        </p>
                      ) : null}
                      <FieldError name="serviceId" />
                    </div>

                    <div>
                      <label
                        htmlFor="priority"
                        className="mb-1.5 block text-sm font-medium text-ink"
                      >
                        {t("priority")}{" "}
                        <span className="text-brand" aria-hidden="true">*</span>
                      </label>
                      <Field
                        as="select"
                        id="priority"
                        name="priority"
                        aria-required="true"
                        className={inputClass}
                        {...fieldA11y("priority", errors, touched)}
                      >
                        {SERVICE_REQUEST_PRIORITIES.map((value) => (
                          <option key={value} value={value}>
                            {formatLabel(value, priorityLabels)}
                          </option>
                        ))}
                      </Field>
                      <FieldError name="priority" />
                    </div>

                    {canAssign && !editing ? (
                      <div>
                        <label
                          htmlFor="assigneeId"
                          className="mb-1.5 block text-sm font-medium text-ink"
                        >
                          {t("assignee")}
                        </label>
                        <Field
                          as="select"
                          id="assigneeId"
                          name="assigneeId"
                          className={inputClass}
                          {...fieldA11y("assigneeId", errors, touched, "assigneeId-hint")}
                        >
                          <option value="">{t("assigneePlaceholder")}</option>
                          {officers.map((officer) => (
                            <option key={officer.id} value={officer.id}>
                              {officer.name}
                            </option>
                          ))}
                        </Field>
                        <p id="assigneeId-hint" className="mt-1 text-xs text-muted">
                          {t("assigneeHint")}
                        </p>
                        <FieldError name="assigneeId" />
                      </div>
                    ) : null}

                    {formError ? (
                      <p className="text-sm text-red-600" role="alert">
                        {formError}
                      </p>
                    ) : null}
                  </div>

                  <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-ink"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || services.length === 0}
                      className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                    >
                      {isSubmitting
                        ? editing
                          ? t("editSubmitting")
                          : t("submitting")
                        : editing
                          ? t("editSubmit")
                          : t("submit")}
                    </button>
                  </div>
                </Form>
              );
            }}
          </Formik>
        )}
      </div>
    </div>
  );
}
