/**
 * Skeleton Loading Components for Admin Dashboard
 * Provides grey wireframe UI loading states
 */

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-6 animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* Header with badges */}
              <div className="flex items-center gap-3">
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>

              {/* Contact info */}
              <div className="flex items-center gap-4">
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>

              {/* Message preview */}
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>

            {/* Action button */}
            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-3">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-3">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityListSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 animate-pulse"
        >
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      ))}
      <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  );
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`} />;
}

export function DashboardPageSkeleton() {
  return (
    <div aria-label="Loading dashboard" className="space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-56" />
        <SkeletonBlock className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-4 h-8 w-32" />
            <SkeletonBlock className="mt-4 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <SkeletonBlock className="h-5 w-44" />
        <SkeletonBlock className="mt-6 h-64 w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <SkeletonBlock className="h-5 w-40" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 3 }).map((__, row) => (
                <SkeletonBlock key={row} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TablePageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-label="Loading records" className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2"><SkeletonBlock className="h-7 w-52" /><SkeletonBlock className="h-4 w-72 max-w-full" /></div>
        <SkeletonBlock className="h-10 w-32" />
      </div>
      <div className="flex flex-wrap gap-3"><SkeletonBlock className="h-10 w-64 max-w-full" /><SkeletonBlock className="h-10 w-36" /></div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex gap-5 border-b border-gray-200 p-4 dark:border-gray-700">
          {Array.from({ length: 5 }).map((_, index) => <SkeletonBlock key={index} className="h-4 flex-1" />)}
          <SkeletonBlock className="h-4 w-20" />
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-5 border-b border-gray-100 p-4 last:border-0 dark:border-gray-700">
            {Array.from({ length: 5 }).map((__, cell) => <SkeletonBlock key={cell} className="h-4 flex-1" />)}
            <div className="flex w-20 gap-2"><SkeletonBlock className="h-8 w-8" /><SkeletonBlock className="h-8 w-8" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div aria-label="Loading cards" className="space-y-6">
      <div className="flex items-center justify-between gap-4"><div className="space-y-2"><SkeletonBlock className="h-7 w-52" /><SkeletonBlock className="h-4 w-72 max-w-full" /></div><SkeletonBlock className="h-10 w-32" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <SkeletonBlock className="h-40 w-full" /><SkeletonBlock className="mt-4 h-5 w-2/3" /><SkeletonBlock className="mt-3 h-4 w-full" /><SkeletonBlock className="mt-2 h-4 w-4/5" />
            <div className="mt-5 flex gap-2"><SkeletonBlock className="h-9 w-20" /><SkeletonBlock className="h-9 w-20" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminRouteSkeleton({ pathname = '' }: { pathname?: string }) {
  if (pathname === '/admin' || pathname === '/admin/') return <DashboardPageSkeleton />;
  if (pathname === '/admin/website' || pathname.includes('/website/gallery') || pathname.includes('/media')) return <CardGridPageSkeleton />;
  if (pathname.includes('/website/homepage') || pathname.includes('/website/company-info') || pathname.includes('/settings')) {
    return <FormSkeleton />;
  }
  return <TablePageSkeleton />;
}
