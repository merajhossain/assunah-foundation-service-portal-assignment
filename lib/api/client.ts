import { isRequestAborted } from "./abort";
import type { ApiResponse, HttpMethod, QueryParams } from "./types";

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: string,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: QueryParams;
  signal?: AbortSignal;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  /** Milliseconds before the request is abandoned with `REQUEST_TIMEOUT`. */
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;

/** Links the caller's signal with a timeout, remembering which one fired. */
function linkTimeout(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onAbort = () => controller.abort();
  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener("abort", onAbort, { once: true });
  }

  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    dispose() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    },
  };
}

function buildUrl(path: string, query?: QueryParams) {
  if (!query) {
    return path;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) {
          continue;
        }
        params.append(key, String(item));
      }
      continue;
    }

    params.set(key, String(value));
  }

  const qs = params.toString();
  if (!qs) {
    return path;
  }

  return `${path}${path.includes("?") ? "&" : "?"}${qs}`;
}

async function parseJson<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiRequestError(
      "INTERNAL_ERROR",
      "Invalid response from server.",
      response.status || 500,
    );
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    signal,
    headers,
    credentials = "same-origin",
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const linked = linkTimeout(signal, timeoutMs);
  let response: Response;
  let payload: ApiResponse<T>;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal: linked.signal,
      credentials,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    payload = await parseJson<T>(response);
  } catch (error) {
    if (linked.timedOut()) {
      throw new ApiRequestError(
        "REQUEST_TIMEOUT",
        "The server took too long to respond.",
        408,
      );
    }
    if (isRequestAborted(error) || signal?.aborted) {
      throw new ApiRequestError(
        "REQUEST_ABORTED",
        "Request was cancelled.",
        499,
      );
    }
    if (error instanceof ApiRequestError) {
      throw error;
    }
    throw new ApiRequestError(
      "NETWORK_ERROR",
      "Could not reach the server. Check your connection and try again.",
      0,
    );
  } finally {
    linked.dispose();
  }

  if (!payload || payload.success !== true) {
    throw new ApiRequestError(
      payload?.success === false ? payload.error.code : "INTERNAL_ERROR",
      payload?.success === false ? payload.error.message : "Request failed.",
      response.status || 500,
      payload?.success === false ? payload.error.details : undefined,
    );
  }

  return payload.data;
}

export const api = {
  get<T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return apiRequest<T>(path, { ...options, method: "GET" });
  },
  post<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) {
    return apiRequest<T>(path, { ...options, method: "POST", body });
  },
  put<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) {
    return apiRequest<T>(path, { ...options, method: "PUT", body });
  },
  patch<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) {
    return apiRequest<T>(path, { ...options, method: "PATCH", body });
  },
  delete<T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return apiRequest<T>(path, { ...options, method: "DELETE" });
  },
};

export type AbortableRequest = {
  abort: () => void;
  nextSignal: () => AbortSignal;
  signal: () => AbortSignal | undefined;
};

export function createAbortableRequest(): AbortableRequest {
  let controller: AbortController | null = null;

  return {
    abort() {
      controller?.abort();
      controller = null;
    },
    nextSignal() {
      controller?.abort();
      controller = new AbortController();
      return controller.signal;
    },
    signal() {
      return controller?.signal;
    },
  };
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

export function isAbortedError(error: unknown) {
  return (
    isApiRequestError(error) && error.code === "REQUEST_ABORTED"
  );
}
