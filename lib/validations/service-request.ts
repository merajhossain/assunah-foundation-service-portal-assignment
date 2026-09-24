import * as Yup from "yup";
import {
  SERVICE_REQUEST_PRIORITIES,
  SERVICE_REQUEST_STATUSES,
  type ServiceRequestPriority,
  type ServiceRequestStatus,
} from "@/lib/services/service-request-status";

export const updateServiceRequestSchema = Yup.object({
  status: Yup.string()
    .oneOf([...SERVICE_REQUEST_STATUSES], "Invalid status.")
    .required("Status is required."),
  assigneeId: Yup.number()
    .integer()
    .positive()
    .nullable()
    .optional()
    .transform((value, original) =>
      original === "" || original === undefined ? null : value,
    ),
  note: Yup.string().trim().max(1000, "Note is too long.").optional(),
  expectedUpdatedAt: Yup.string()
    .required("expectedUpdatedAt is required.")
    .test(
      "iso-date",
      "expectedUpdatedAt must be a valid date.",
      (value) => !Number.isNaN(Date.parse(value ?? "")),
    ),
});

export type UpdateServiceRequestInput = {
  status: ServiceRequestStatus;
  assigneeId: number | null;
  note?: string;
  /** `updatedAt` the client last saw; used for optimistic concurrency. */
  expectedUpdatedAt: string;
};

export async function parseUpdateServiceRequestBody(
  body: unknown,
): Promise<UpdateServiceRequestInput> {
  const value = await updateServiceRequestSchema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });

  return {
    status: value.status as ServiceRequestStatus,
    assigneeId: value.assigneeId ?? null,
    note: value.note?.trim() || undefined,
    expectedUpdatedAt: value.expectedUpdatedAt,
  };
}

export const createServiceRequestSchema = Yup.object({
  subject: Yup.string()
    .trim()
    .min(3, "Subject is too short.")
    .max(255, "Subject is too long.")
    .required("Subject is required."),
  description: Yup.string()
    .trim()
    .min(10, "Description is too short.")
    .max(5000, "Description is too long.")
    .required("Description is required."),
  serviceId: Yup.number()
    .transform((_value, original) =>
      original === "" || original === null || original === undefined
        ? undefined
        : Number(original),
    )
    .integer()
    .positive("Select a service.")
    .required("Service is required."),
  priority: Yup.string()
    .oneOf([...SERVICE_REQUEST_PRIORITIES], "Invalid priority.")
    .required("Priority is required."),
  assigneeId: Yup.number()
    .transform((_value, original) =>
      original === "" || original === null || original === undefined
        ? null
        : Number(original),
    )
    .integer()
    .positive()
    .nullable()
    .optional(),
});

export type CreateServiceRequestInput = {
  subject: string;
  description: string;
  serviceId: number;
  priority: ServiceRequestPriority;
  assigneeId: number | null;
};

export const editRequesterRequestSchema = Yup.object({
  subject: Yup.string()
    .trim()
    .min(3, "Subject is too short.")
    .max(255, "Subject is too long.")
    .required("Subject is required."),
  description: Yup.string()
    .trim()
    .min(10, "Description is too short.")
    .max(5000, "Description is too long.")
    .required("Description is required."),
  serviceId: Yup.number()
    .transform((_value, original) =>
      original === "" || original === null || original === undefined
        ? undefined
        : Number(original),
    )
    .integer()
    .positive("Select a service.")
    .required("Service is required."),
  priority: Yup.string()
    .oneOf([...SERVICE_REQUEST_PRIORITIES], "Invalid priority.")
    .required("Priority is required."),
  expectedUpdatedAt: Yup.string()
    .required("expectedUpdatedAt is required.")
    .test(
      "iso-date",
      "expectedUpdatedAt must be a valid date.",
      (value) => !Number.isNaN(Date.parse(value ?? "")),
    ),
});

export type EditRequesterRequestInput = {
  subject: string;
  description: string;
  serviceId: number;
  priority: ServiceRequestPriority;
  expectedUpdatedAt: string;
};

export async function parseEditRequesterRequestBody(
  body: unknown,
): Promise<EditRequesterRequestInput> {
  const value = await editRequesterRequestSchema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });

  return {
    subject: value.subject.trim(),
    description: value.description.trim(),
    serviceId: value.serviceId,
    priority: value.priority as ServiceRequestPriority,
    expectedUpdatedAt: value.expectedUpdatedAt,
  };
}

export async function parseCreateServiceRequestBody(
  body: unknown,
): Promise<CreateServiceRequestInput> {
  const value = await createServiceRequestSchema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });

  return {
    subject: value.subject.trim(),
    description: value.description.trim(),
    serviceId: value.serviceId,
    priority: value.priority as ServiceRequestPriority,
    assigneeId: value.assigneeId ?? null,
  };
}
