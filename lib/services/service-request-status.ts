export const SERVICE_REQUEST_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const SERVICE_REQUEST_PRIORITIES = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;

export type ServiceRequestPriority =
  (typeof SERVICE_REQUEST_PRIORITIES)[number];

/** Lower rank sorts first. Stored in `service_requests.priority_rank`. */
export const PRIORITY_RANK: Record<ServiceRequestPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const SOLVED_STATUSES = ["resolved", "closed"] as const;

export function priorityRankOf(priority: string) {
  return PRIORITY_RANK[priority as ServiceRequestPriority] ?? PRIORITY_RANK.medium;
}

export function isServiceRequestStatus(
  value: string,
): value is ServiceRequestStatus {
  return (SERVICE_REQUEST_STATUSES as readonly string[]).includes(value);
}

export function isServiceRequestPriority(
  value: string,
): value is ServiceRequestPriority {
  return (SERVICE_REQUEST_PRIORITIES as readonly string[]).includes(value);
}
