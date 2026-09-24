import { ApiError } from "./errors";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true as const, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    return {
      allowed: false as const,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  buckets.set(key, current);

  return {
    allowed: true as const,
    remaining: limit - current.count,
    resetAt: current.resetAt,
  };
}

const MUTATION_RATE_LIMIT: RateLimitOptions = {
  limit: 20,
  windowMs: 60 * 1000,
};

/** Throws a 429 `ApiError` when a user exceeds the write budget for a scope. */
export function assertMutationRateLimit(scope: string, userId: number) {
  const rate = checkRateLimit(`${scope}:${userId}`, MUTATION_RATE_LIMIT);
  if (!rate.allowed) {
    throw new ApiError(
      "TOO_MANY_REQUESTS",
      "Too many requests. Please wait a moment and try again.",
      429,
    );
  }
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}
