/**
 * Live admin notifications.
 *
 * One provider, mounted once by the admin shell, owns:
 * - the notification list (new enquiries + client responses to quotes, last 7 days)
 * - a Supabase Realtime subscription, so new items arrive without a refresh
 * - toasts, optional desktop alerts, and the "new enquiries" count for the sidebar
 * - read state (kept per browser in localStorage)
 *
 * Realtime needs `submissions` and `quote_responses` in the `supabase_realtime`
 * publication (see supabase/migrations/*_dashboard_realtime.sql). Until that is
 * applied, or whenever the socket drops, the provider falls back to polling so the
 * bell never goes stale.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { subDays } from 'date-fns';
import { supabase } from '@/lib/supabase';

export type NotificationKind = 'enquiry' | 'quote_accepted' | 'quote_declined' | 'quote_revision';
export type LiveStatus = 'connecting' | 'live' | 'offline';

export interface AdminNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  link: '/admin/enquiries' | '/admin/quotes';
  createdAt: string;
}

interface NotificationsContextValue {
  notifications: AdminNotification[];
  unreadCount: number;
  newEnquiryCount: number;
  isLoading: boolean;
  status: LiveStatus;
  /** Increments whenever a live event arrives, so pages can refetch their data. */
  revision: number;
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  desktopAlerts: NotificationPermission | 'unsupported';
  enableDesktopAlerts: () => Promise<void>;
}

const noop = () => undefined;

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  unreadCount: 0,
  newEnquiryCount: 0,
  isLoading: false,
  status: 'offline',
  revision: 0,
  isRead: () => true,
  markRead: noop,
  markAllRead: noop,
  desktopAlerts: 'unsupported',
  enableDesktopAlerts: async () => undefined,
});

export function useNotifications() {
  return useContext(NotificationsContext);
}

// Same key as the previous panel, so items people already opened stay read.
const READ_KEY = 'yahaya_viewed_notifications';
const WINDOW_DAYS = 7;
const LIST_LIMIT = 30;
const FALLBACK_POLL_MS = 60_000;

function loadReadIds(): Set<string> {
  try {
    const stored = localStorage.getItem(READ_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Storage blocked (private mode etc.): read state just won't persist.
  }
}

const FORM_LABELS: Record<string, string> = {
  contact: 'contact',
  travel: 'travel',
  trade: 'trade',
};

interface SubmissionRow {
  id: string;
  name: string | null;
  form_type: string | null;
  created_at: string;
}

interface QuoteSummary {
  quote_number: string | null;
  client_name: string | null;
}

interface ResponseRow {
  id: string;
  quote_id: string;
  response_type: 'accepted' | 'declined' | 'revision_requested';
  response_method: string | null;
  recorded_by: string | null;
  created_at: string;
  quotes?: QuoteSummary | QuoteSummary[] | null;
}

function fromSubmission(row: SubmissionRow): AdminNotification {
  const form = row.form_type ? FORM_LABELS[row.form_type] ?? row.form_type : 'website';
  return {
    id: `enquiry-${row.id}`,
    kind: 'enquiry',
    title: 'New enquiry',
    message: `${row.name?.trim() || 'Someone'} sent a ${form} enquiry`,
    link: '/admin/enquiries',
    createdAt: row.created_at,
  };
}

function fromResponse(row: ResponseRow, quote: QuoteSummary | null): AdminNotification {
  const client = quote?.client_name?.trim() || 'A client';
  const ref = quote?.quote_number || 'a quote';
  const via = row.response_method && row.response_method !== 'online' ? ` (recorded by staff)` : '';
  const byKind = {
    accepted: { kind: 'quote_accepted', title: 'Quote accepted', verb: 'accepted' },
    declined: { kind: 'quote_declined', title: 'Quote declined', verb: 'declined' },
    revision_requested: { kind: 'quote_revision', title: 'Revision requested', verb: 'asked for changes to' },
  } as const;
  const meta = byKind[row.response_type] ?? byKind.revision_requested;
  return {
    id: `response-${row.id}`,
    kind: meta.kind,
    title: meta.title,
    message: `${client} ${meta.verb} ${ref}${via}`,
    link: '/admin/quotes',
    createdAt: row.created_at,
  };
}

function firstQuote(value: ResponseRow['quotes']): QuoteSummary | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function mergeNotifications(current: AdminNotification[], incoming: AdminNotification[]) {
  const byId = new Map(current.map((n) => [n.id, n]));
  for (const n of incoming) byId.set(n.id, n);
  return Array.from(byId.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, LIST_LIMIT);
}

export function NotificationsProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() =>
    typeof window === 'undefined' ? new Set() : loadReadIds(),
  );
  const [newEnquiryCount, setNewEnquiryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const [revision, setRevision] = useState(0);
  const [desktopAlerts, setDesktopAlerts] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  );
  const myUserId = useRef<string | null>(null);
  const seenIds = useRef<Set<string>>(new Set());

  const refreshEnquiryCount = useCallback(async () => {
    const { count, error } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new');
    if (!error) setNewEnquiryCount(count ?? 0);
  }, []);

  const loadAll = useCallback(async () => {
    const since = subDays(new Date(), WINDOW_DAYS).toISOString();
    const [enquiries, responses] = await Promise.all([
      supabase
        .from('submissions')
        .select('id, name, form_type, created_at')
        .eq('status', 'new')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(LIST_LIMIT),
      supabase
        .from('quote_responses')
        .select('id, quote_id, response_type, response_method, recorded_by, created_at, quotes(quote_number, client_name)')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(LIST_LIMIT),
    ]);

    const items: AdminNotification[] = [];
    if (!enquiries.error) items.push(...(enquiries.data as SubmissionRow[]).map(fromSubmission));
    if (!responses.error) {
      items.push(...(responses.data as ResponseRow[]).map((row) => fromResponse(row, firstQuote(row.quotes))));
    }
    if (enquiries.error) console.error('Notifications: unable to load enquiries', enquiries.error.message);
    if (responses.error) console.error('Notifications: unable to load quote responses', responses.error.message);

    for (const item of items) seenIds.current.add(item.id);
    setNotifications(mergeNotifications([], items));
    await refreshEnquiryCount();
    setIsLoading(false);
  }, [refreshEnquiryCount]);

  const announce = useCallback(
    (item: AdminNotification, quiet: boolean) => {
      if (seenIds.current.has(item.id)) return;
      seenIds.current.add(item.id);
      setNotifications((current) => mergeNotifications(current, [item]));
      setRevision((r) => r + 1);
      if (quiet) return;

      toast(item.title, {
        id: item.id,
        description: item.message,
        action: { label: 'View', onClick: () => void navigate({ to: item.link }) },
      });

      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        const desktop = new Notification(item.title, { body: item.message, tag: item.id });
        desktop.onclick = () => {
          window.focus();
          void navigate({ to: item.link });
          desktop.close();
        };
      }
    },
    [navigate],
  );

  // Initial load + realtime subscription.
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    void supabase.auth.getUser().then(({ data }) => {
      myUserId.current = data.user?.id ?? null;
    });
    void loadAll();

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        // Polling only fills gaps; it never toasts (we can't tell old from new reliably).
        void loadAll();
      }, FALLBACK_POLL_MS);
    };
    const stopPolling = () => {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
    };

    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, (payload) => {
        const row = payload.new as SubmissionRow;
        announce(fromSubmission(row), false);
        void refreshEnquiryCount();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'submissions' }, () => {
        // Someone marked an enquiry read/responded: keep the sidebar badge honest.
        void refreshEnquiryCount();
        setRevision((r) => r + 1);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quote_responses' }, async (payload) => {
        const row = payload.new as ResponseRow;
        const { data } = await supabase
          .from('quotes')
          .select('quote_number, client_name')
          .eq('id', row.quote_id)
          .maybeSingle();
        if (!active) return;
        // Don't toast someone about a response they just recorded themselves.
        const quiet = !!row.recorded_by && row.recorded_by === myUserId.current;
        announce(fromResponse(row, (data as QuoteSummary | null) ?? null), quiet);
      })
      .subscribe((state) => {
        if (!active) return;
        if (state === 'SUBSCRIBED') {
          setStatus('live');
          stopPolling();
        } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
          setStatus('offline');
          startPolling();
        }
      });

    // Catch up after the laptop sleeps or the tab was in the background for a while.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void loadAll();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      stopPolling();
      document.removeEventListener('visibilitychange', onVisible);
      void supabase.removeChannel(channel);
    };
  }, [enabled, loadAll, announce, refreshEnquiryCount]);

  const markRead = useCallback((id: string) => {
    setReadIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds((current) => {
      // Keep only ids still in the window, so the stored set can't grow forever.
      const next = new Set(notifications.map((n) => n.id));
      for (const id of current) if (seenIds.current.has(id)) next.add(id);
      saveReadIds(next);
      return next;
    });
  }, [notifications]);

  const enableDesktopAlerts = useCallback(async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setDesktopAlerts(result);
  }, []);

  const value = useMemo<NotificationsContextValue>(() => {
    const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;
    return {
      notifications,
      unreadCount,
      newEnquiryCount,
      isLoading: enabled && isLoading,
      status: enabled ? status : 'offline',
      revision,
      isRead: (id) => readIds.has(id),
      markRead,
      markAllRead,
      desktopAlerts,
      enableDesktopAlerts,
    };
  }, [notifications, readIds, newEnquiryCount, enabled, isLoading, status, revision, markRead, markAllRead, desktopAlerts, enableDesktopAlerts]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
