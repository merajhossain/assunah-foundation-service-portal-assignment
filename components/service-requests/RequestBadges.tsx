function formatLabel(value: string, map?: Record<string, string>) {
  if (map?.[value]) {
    return map[value];
  }
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function PriorityBadge({
  priority,
  label,
}: {
  priority: string;
  label?: string;
}) {
  const styles: Record<string, string> = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-sky-100 text-sky-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
        styles[priority] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {label ?? formatLabel(priority)}
    </span>
  );
}

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const styles: Record<string, string> = {
    open: "bg-slate-100 text-slate-700",
    assigned: "bg-violet-100 text-violet-800",
    in_review: "bg-cyan-100 text-cyan-800",
    pending: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
    in_progress: "bg-emerald-100 text-emerald-800",
    on_hold: "bg-amber-100 text-amber-800",
    resolved: "bg-blue-100 text-blue-800",
    closed: "bg-zinc-200 text-zinc-800",
  };

  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
        styles[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {label ?? formatLabel(status)}
    </span>
  );
}

export { formatLabel };
