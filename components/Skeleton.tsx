export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200/70 ${className}`} />;
}

export function DashboardSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <SkeletonBlock className="h-8 w-64" />
          <SkeletonBlock className="h-4 w-48" />
        </div>
        <SkeletonBlock className="h-10 w-32 rounded-lg" />
      </div>
      <div className="mt-8 space-y-3">
        <SkeletonBlock className="h-10 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {[0, 1, 2, 3, 4].map((key) => (
            <SkeletonBlock key={key} className="h-9 sm:w-36 rounded-lg" />
          ))}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          {Array.from({ length: 8 }, (_, index) => (
            <SkeletonBlock key={index} className="my-3 h-6 w-full" />
          ))}
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function RequestDetailSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="space-y-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-36" />
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-8 w-3/4 max-w-xl" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-5 w-20 rounded-md" />
          <SkeletonBlock className="h-5 w-16 rounded-md" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
        <div className="space-y-6">
          <div className="grid gap-5 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <div key={key} className="space-y-2">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-4 w-40" />
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
            {[0, 1, 2, 3].map((key) => (
              <SkeletonBlock key={key} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
