import { ApiError, isApiError } from "./errors";

export function isRequestAborted(error: unknown) {
  if (isApiError(error) && error.code === "REQUEST_ABORTED") {
    return true;
  }

  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError"
  );
}

export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new ApiError("REQUEST_ABORTED", "Request was cancelled.", 499);
  }
}
