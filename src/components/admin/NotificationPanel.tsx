import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Bell, BellRing, CheckCheck, CheckCircle2, Inbox, Loader2, MessageSquareDiff, XCircle } from 'lucide-react';
import { formatDistanceToNowStrict, isToday } from 'date-fns';
import { useNotifications, type AdminNotification, type NotificationKind } from '@/lib/notifications';
import { LiveIndicator } from '@/components/admin/LiveIndicator';

const KIND_STYLE: Record<NotificationKind, { icon: typeof Inbox; tone: string }> = {
  enquiry: { icon: Inbox, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300' },
  quote_accepted: { icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300' },
  quote_declined: { icon: XCircle, tone: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' },
  quote_revision: { icon: MessageSquareDiff, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300' },
};

type Filter = 'all' | 'unread';

/** Bell button + notification popover. Data comes from NotificationsProvider. */
export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isLoading,
    status,
    isRead,
    markRead,
    markAllRead,
    desktopAlerts,
    enableDesktopAlerts,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const visible = filter === 'unread' ? notifications.filter((n) => !isRead(n.id)) : notifications;
  const today = visible.filter((n) => isToday(new Date(n.createdAt)));
  const earlier = visible.filter((n) => !isToday(new Date(n.createdAt)));

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          {unreadCount > 0 ? <BellRing className="h-[18px] w-[18px]" /> : <Bell className="h-[18px] w-[18px]" />}
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white tabular-nums dark:ring-gray-950">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 flex max-h-[min(36rem,calc(100vh-5rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 dark:border-white/10 dark:bg-gray-900 dark:shadow-black/40"
        >
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <LiveIndicator status={status} compact />
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-default disabled:text-gray-400 disabled:hover:bg-transparent dark:text-blue-400 dark:hover:bg-blue-500/10 dark:disabled:text-gray-600"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>

          <div role="tablist" aria-label="Filter notifications" className="flex gap-1 px-4 pt-3">
            {(['all', 'unread'] as const).map((value) => (
              <button
                key={value}
                role="tab"
                type="button"
                aria-selected={filter === value}
                onClick={() => setFilter(value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filter === value
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
                }`}
              >
                {value === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` · ${unreadCount}` : ''}`}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-2" aria-live="polite">
            {isLoading ? (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : visible.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
                  <CheckCheck className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">You're all caught up</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  New enquiries and quote responses appear here as they happen.
                </p>
              </div>
            ) : (
              <>
                <NotificationGroup label="Today" items={today} isRead={isRead} onOpen={(n) => { markRead(n.id); setOpen(false); }} />
                <NotificationGroup label="Earlier this week" items={earlier} isRead={isRead} onOpen={(n) => { markRead(n.id); setOpen(false); }} />
              </>
            )}
          </div>

          {desktopAlerts === 'default' && (
            <div className="border-t border-gray-100 px-4 py-3 dark:border-white/5">
              <button
                type="button"
                onClick={() => void enableDesktopAlerts()}
                className="w-full rounded-lg bg-gray-50 px-3 py-2 text-left text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
              >
                <span className="font-medium text-gray-900 dark:text-white">Turn on desktop alerts</span>
                <span className="block">Get notified even when this tab is in the background.</span>
              </button>
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function NotificationGroup({
  label,
  items,
  isRead,
  onOpen,
}: {
  label: string;
  items: AdminNotification[];
  isRead: (id: string) => boolean;
  onOpen: (n: AdminNotification) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="px-2 pb-1">
      <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      <ul>
        {items.map((n) => {
          const { icon: Icon, tone } = KIND_STYLE[n.kind];
          const unread = !isRead(n.id);
          return (
            <li key={n.id}>
              <Link
                to={n.link}
                onClick={() => onOpen(n)}
                className="flex gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none dark:hover:bg-white/5 dark:focus-visible:bg-white/5"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${unread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                      {n.title}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
                      {formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-gray-500 dark:text-gray-400">{n.message}</span>
                </span>
                {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" aria-label="Unread" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
