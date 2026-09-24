import { api } from "@/lib/api/client";
import type {
  ActivityPage,
  ServiceRequestDetail,
  UpdatedServiceRequest,
} from "@/lib/services/service-request-detail";
import type { EditedServiceRequest } from "@/lib/services/service-request-edit";
import type {
  EditRequesterRequestInput,
  UpdateServiceRequestInput,
} from "@/lib/validations/service-request";

export type {
  ActivityPage,
  ServiceRequestDetail,
  UpdatedServiceRequest,
} from "@/lib/services/service-request-detail";

function requestPath(publicId: string) {
  return `/api/service-requests/${encodeURIComponent(publicId)}`;
}

export function fetchServiceRequestDetail(
  publicId: string,
  options?: { signal?: AbortSignal },
) {
  return api.get<ServiceRequestDetail>(requestPath(publicId), {
    signal: options?.signal,
  });
}

export function fetchServiceRequestActivities(
  publicId: string,
  cursor: number,
  options?: { signal?: AbortSignal },
) {
  return api.get<ActivityPage>(`${requestPath(publicId)}/activities`, {
    query: { cursor },
    signal: options?.signal,
  });
}

export function editRequesterServiceRequest(
  publicId: string,
  payload: EditRequesterRequestInput,
  options?: { signal?: AbortSignal },
) {
  return api.patch<EditedServiceRequest>(requestPath(publicId), payload, {
    signal: options?.signal,
  });
}

export function updateServiceRequestRequest(
  publicId: string,
  payload: UpdateServiceRequestInput,
  options?: { signal?: AbortSignal },
) {
  return api.patch<UpdatedServiceRequest>(
    `${requestPath(publicId)}/status`,
    payload,
    { signal: options?.signal },
  );
}
