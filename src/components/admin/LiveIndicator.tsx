import type { LiveStatus } from '@/lib/notifications';

const LABEL: Record<LiveStatus, string> = {
  live: 'Live',
  connecting: 'Connecting',
  offline: 'Refreshing every minute',
};

const HINT: Record<LiveStatus, string> = {
  live: 'Connected: new enquiries and quote responses arrive instantly.',
  connecting: 'Connecting to live updates…',
  offline: 'Live connection unavailable. Checking for updates every minute.',
};

/** Small status pill showing whether the realtime connection is up. */
export function LiveIndicator({ status, compact = false }: { status: LiveStatus; compact?: boolean }) {
  const dot =
    status === 'live' ? 'bg-emerald-500' : status === 'connecting' ? 'bg-amber-400' : 'bg-gray-400 dark:bg-gray-500';
  return (
    <span
      title={HINT[status]}
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:border-white/10 dark:text-gray-400"
    >
      <span className="relative flex h-2 w-2">
        {status === 'live' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      {compact && status === 'offline' ? 'Polling' : LABEL[status]}
      <span className="sr-only">. {HINT[status]}</span>
    </span>
  );
}
