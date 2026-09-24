import { NextResponse } from "next/server";
import { ApiError, isApiError, type ApiErrorCode } from "./errors";
import { isRequestAborted } from "./abort";
import type { ApiFailure, ApiSuccess } from "./types";

export type { ApiResponse } from "./types";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data } satisfies ApiSuccess<T>, {
    status: 200,
    ...init,
  });
}

export function jsonError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown,
  headers?: HeadersInit,
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(details !== undefined ? { details } : {}) },
    } satisfies ApiFailure,
    { status, headers },
  );
}

export function handleRouteError(error: unknown, headers?: HeadersInit) {
  if (isRequestAborted(error)) {
    return jsonError(
      "REQUEST_ABORTED",
      "Request was cancelled.",
      499,
      undefined,
      headers,
    );
  }

  if (isApiError(error)) {
    return jsonError(
      error.code,
      error.message,
      error.status,
      error.details,
      headers,
    );
  }

  console.error("[api]", error);
  return jsonError(
    "INTERNAL_ERROR",
    "Something went wrong.",
    500,
    undefined,
    headers,
  );
}

export function assertMethod(request: Request, allowed: readonly string[]) {
  if (!allowed.includes(request.method)) {
    throw new ApiError(
      "METHOD_NOT_ALLOWED",
      `Method ${request.method} is not allowed.`,
      405,
    );
  }
}

export { throwIfAborted, isRequestAborted } from "./abort";
