import { api } from "@/lib/api/client";
import type { ServiceRequestListQuery } from "@/lib/services/service-request-query";
import type {
  CreateServiceRequestOptions,
  CreatedServiceRequest,
} from "@/lib/services/service-request-create";
import type { ServiceRequestsListResult } from "@/lib/services/service-requests";
import type { CreateServiceRequestInput } from "@/lib/validations/service-request";

export type {
  ServiceRequestRow,
  ServiceRequestsListResult,
} from "@/lib/services/service-requests";

export type {
  CreateServiceRequestOptions,
  CreatedServiceRequest,
  OfficerOption,
  ServiceOption,
} from "@/lib/services/service-request-create";

export function fetchServiceRequestsList(options?: {
  query?: ServiceRequestListQuery;
  signal?: AbortSignal;
}) {
  return api.get<ServiceRequestsListResult>("/api/service-requests", {
    query: {
      q: options?.query?.q,
      status: options?.query?.status,
      category: options?.query?.category,
      priority: options?.query?.priority,
      assignee: options?.query?.assignee,
      sort: options?.query?.sort,
      page: options?.query?.page,
      pageSize: options?.query?.pageSize,
    },
    signal: options?.signal,
  });
}

export function fetchCreateServiceRequestOptions(options?: {
  signal?: AbortSignal;
}) {
  return api.get<CreateServiceRequestOptions>("/api/service-requests", {
    query: { meta: "create" },
    signal: options?.signal,
  });
}

export function createServiceRequestRequest(
  payload: CreateServiceRequestInput,
  options?: { signal?: AbortSignal },
) {
  return api.post<CreatedServiceRequest>("/api/service-requests", payload, {
    signal: options?.signal,
  });
}
