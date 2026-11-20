import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthContext } from '@/components/admin/AdminAuthContext';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess, type AdminUser } from '@/lib/auth';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotifications, type NotificationKind } from '@/lib/notifications';
import { LiveIndicator } from '@/components/admin/LiveIndicator';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  FileText,
  Inbox,
  MessageSquareDiff,
  Minus,
  Plus,
  Receipt,
  RefreshCw,
  Table2,
  LineChart as LineChartIcon,
  Users,
  Wallet,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  differenceInCalendarYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  format,
  formatDistanceToNowStrict,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { DashboardPageSkeleton } from '@/components/admin/SkeletonLoader';

import { btn, segmentClass } from '@/components/admin/ui';
export const Route = createFileRoute('/admin/')({
  // The admin session lives in localStorage, so auth can only be checked in the browser.
  // Without this, beforeLoad ran during SSR, found no session and 307-redirected to login.
  ssr: false,
  beforeLoad: async ({ location }) => {
    const result = await checkAdminAccess();
    if (!result.isAdmin) {
      throw redirect({ to: '/admin/login', search: { redirect: location.href } });
    }
  },
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <AdminDashboard />
      </AdminGuard>
    </ThemeProvider>
  ),
});

// ---------------------------------------------------------------------------
// Periods
// ---------------------------------------------------------------------------

type TimePeriod = 'week' | 'month' | 'year' | 'all';

const PERIODS: { value: TimePeriod; short: string; long: string; previous: string }[] = [
  { value: 'week', short: '7D', long: 'Last 7 days', previous: 'previous 7 days' },
  { value: 'month', short: '30D', long: 'Last 30 days', previous: 'previous 30 days' },
  { value: 'year', short: '12M', long: 'Last 12 months', previous: 'previous 12 months' },
  { value: 'all', short: 'All', long: 'All time', previous: '' },
];

interface PeriodRange {
  start: Date | null;
  end: Date;
  prevStart: Date | null;
}

function rangeFor(period: TimePeriod, now = new Date()): PeriodRange {
  const today = startOfDay(now);
  switch (period) {
    case 'week': {
      const start = subDays(today, 6);
      return { start, end: now, prevStart: subDays(start, 7) };
    }
    case 'month': {
      const start = subDays(today, 29);
      return { start, end: now, prevStart: subDays(start, 30) };
    }
    case 'year': {
      const start = startOfMonth(subMonths(now, 11));
      return { start, end: now, prevStart: subMonths(start, 12) };
    }
    case 'all':
      return { start: null, end: now, prevStart: null };
  }
}

const day = (d: Date) => format(d, 'yyyy-MM-dd');

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// ---------------------------------------------------------------------------
// Data shapes
// ---------------------------------------------------------------------------

interface FinanceSummary {
  revenue: number;
  expenses: number;
  net: number;
  revenueDelta: number | null;
  expensesDelta: number | null;
  netDelta: number | null;
  margin: number | null;
}

interface OpsSummary {
  enquiries: number;
  enquiriesDelta: number | null;
  activeClients: number;
  awaitingClient: number;
  won: number;
  wonDelta: number | null;
}

interface CashFlowPoint {
  key: string;
  label: string;
  revenue: number;
  expenses: number;
  net: number;
}

interface InboxItem {
  id: string;
  name: string;
  email: string | null;
  form_type: string;
  message: string | null;
  created_at: string;
}

const ngn = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
const ngnCompact = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  notation: 'compact',
  maximumFractionDigits: 1,
});

// Validated categorical pair (dataviz reference palette, slots 1-2), stepped per theme.
const CHART_CONFIG = {
  revenue: { label: 'Revenue', theme: { light: '#2a78d6', dark: '#3987e5' } },
  expenses: { label: 'Expenses', theme: { light: '#eb6834', dark: '#d95926' } },
};

// ---------------------------------------------------------------------------
// Cash-flow bucketing
// ---------------------------------------------------------------------------

function buildCashFlow(
  revenueRows: { amount: number; transaction_date: string }[],
  expenseRows: { amount: number; expense_date: string }[],
  period: TimePeriod,
  range: PeriodRange,
): CashFlowPoint[] {
  const dates = [
    ...revenueRows.map((r) => parseISO(r.transaction_date)),
    ...expenseRows.map((e) => parseISO(e.expense_date)),
  ].filter((d) => !Number.isNaN(d.getTime()));

  let keyOf: (d: Date) => string;
  let buckets: { key: string; label: string }[];

  if (period === 'week' || period === 'month') {
    keyOf = (d) => format(d, 'yyyy-MM-dd');
    buckets = eachDayOfInterval({ start: range.start!, end: range.end }).map((d) => ({
      key: keyOf(d),
      label: format(d, period === 'week' ? 'EEE d' : 'd MMM'),
    }));
  } else {
    const start =
      period === 'year'
        ? range.start!
        : dates.length > 0
          ? dates.reduce((a, b) => (b < a ? b : a))
          : range.end;
    const yearly = period === 'all' && differenceInCalendarYears(range.end, start) > 5;
    if (yearly) {
      keyOf = (d) => format(d, 'yyyy');
      buckets = eachYearOfInterval({ start, end: range.end }).map((d) => ({ key: keyOf(d), label: format(d, 'yyyy') }));
    } else {
      keyOf = (d) => format(d, 'yyyy-MM');
      buckets = eachMonthOfInterval({ start, end: range.end }).map((d) => ({ key: keyOf(d), label: format(d, 'MMM yy') }));
    }
  }

  const totals = new Map(buckets.map((b) => [b.key, { revenue: 0, expenses: 0 }]));
  for (const r of revenueRows) {
    const bucket = totals.get(keyOf(parseISO(r.transaction_date)));
    if (bucket) bucket.revenue += Number(r.amount);
  }
  for (const e of expenseRows) {
    const bucket = totals.get(keyOf(parseISO(e.expense_date)));
    if (bucket) bucket.expenses += Number(e.amount);
  }

  return buckets.map(({ key, label }) => {
    const t = totals.get(key)!;
    return { key, label, revenue: Math.round(t.revenue), expenses: Math.round(t.expenses), net: Math.round(t.revenue - t.expenses) };
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function AdminDashboard() {
  const sharedAuth = useContext(AdminAuthContext);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(sharedAuth?.user ?? null);
  const isOwner = adminUser?.role === 'owner';
  const { notifications, newEnquiryCount, status, revision } = useNotifications();

  const [period, setPeriod] = useState<TimePeriod>('month');
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowPoint[]>([]);
  const [ops, setOps] = useState<OpsSummary | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [financeError, setFinanceError] = useState(false);
  const [opsError, setOpsError] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [, setTick] = useState(0);

  const periodMeta = PERIODS.find((p) => p.value === period)!;

  // Resolve the signed-in admin (the shell normally provides it).
  useEffect(() => {
    if (adminUser) return;
    void checkAdminAccess().then(({ user }) => setAdminUser(user ?? null));
  }, [adminUser]);

  const loadOps = useCallback(async (p: TimePeriod) => {
    const range = rangeFor(p);
    const count = (q: PromiseLike<{ count: number | null; error: unknown }>) =>
      Promise.resolve(q).then((r) => {
        if (r.error) throw r.error;
        return r.count ?? 0;
      });

    const enquiriesIn = (from: Date | null, to: Date | null) => {
      let q = supabase.from('submissions').select('id', { count: 'exact', head: true });
      if (from) q = q.gte('created_at', from.toISOString());
      if (to) q = q.lt('created_at', to.toISOString());
      return count(q);
    };
    const wonIn = (from: Date | null, to: Date | null) => {
      let q = supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('status', 'accepted');
      if (from) q = q.gte('updated_at', from.toISOString());
      if (to) q = q.lt('updated_at', to.toISOString());
      return count(q);
    };

    const [enquiries, prevEnquiries, activeClients, awaitingClient, won, prevWon, inboxResult] = await Promise.all([
      enquiriesIn(range.start, null),
      range.prevStart ? enquiriesIn(range.prevStart, range.start) : Promise.resolve(0),
      count(supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active')),
      count(supabase.from('quotes').select('id', { count: 'exact', head: true }).in('status', ['sent', 'pending'])),
      wonIn(range.start, null),
      range.prevStart ? wonIn(range.prevStart, range.start) : Promise.resolve(0),
      supabase
        .from('submissions')
        .select('id, name, email, form_type, message, created_at')
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);
    if (inboxResult.error) throw inboxResult.error;

    setOps({
      enquiries,
      enquiriesDelta: range.prevStart ? percentChange(enquiries, prevEnquiries) : null,
      activeClients,
      awaitingClient,
      won,
      wonDelta: range.prevStart ? percentChange(won, prevWon) : null,
    });
    setInbox((inboxResult.data ?? []) as InboxItem[]);
  }, []);

  const loadFinance = useCallback(async (p: TimePeriod) => {
    const range = rangeFor(p);
    const from = range.prevStart ?? range.start;

    let revenueQuery = supabase
      .from('financial_transactions')
      .select('amount, transaction_date')
      .eq('status', 'active')
      .lte('transaction_date', day(range.end));
    let expenseQuery = supabase
      .from('expense_transactions')
      .select('amount, expense_date')
      .lte('expense_date', day(range.end));
    if (from) {
      revenueQuery = revenueQuery.gte('transaction_date', day(from));
      expenseQuery = expenseQuery.gte('expense_date', day(from));
    }

    const [revenueResult, expenseResult] = await Promise.all([revenueQuery, expenseQuery]);
    if (revenueResult.error) throw revenueResult.error;
    if (expenseResult.error) throw expenseResult.error;

    const revenueRows = (revenueResult.data ?? []) as { amount: number; transaction_date: string }[];
    const expenseRows = (expenseResult.data ?? []) as { amount: number; expense_date: string }[];

    const startKey = range.start ? day(range.start) : null;
    const inCurrent = (date: string) => !startKey || date >= startKey;
    const sum = (rows: { amount: number }[]) => rows.reduce((total, r) => total + Number(r.amount), 0);

    const revenue = sum(revenueRows.filter((r) => inCurrent(r.transaction_date)));
    const expenses = sum(expenseRows.filter((e) => inCurrent(e.expense_date)));
    const prevRevenue = sum(revenueRows.filter((r) => !inCurrent(r.transaction_date)));
    const prevExpenses = sum(expenseRows.filter((e) => !inCurrent(e.expense_date)));
    const hasPrev = !!range.prevStart;

    setFinance({
      revenue,
      expenses,
      net: revenue - expenses,
      revenueDelta: hasPrev ? percentChange(revenue, prevRevenue) : null,
      expensesDelta: hasPrev ? percentChange(expenses, prevExpenses) : null,
      netDelta: hasPrev ? percentChange(revenue - expenses, prevRevenue - prevExpenses) : null,
      margin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : null,
    });
    setCashFlow(
      buildCashFlow(
        revenueRows.filter((r) => inCurrent(r.transaction_date)),
        expenseRows.filter((e) => inCurrent(e.expense_date)),
        p,
        range,
      ),
    );
  }, []);

  const loadAll = useCallback(
    async (p: TimePeriod) => {
      if (!adminUser) return;
      setIsRefreshing(true);
      const tasks: Promise<void>[] = [
        loadOps(p).then(
          () => setOpsError(false),
          (error) => {
            console.error('Dashboard: operations failed', error);
            setOpsError(true);
          },
        ),
      ];
      if (adminUser.role === 'owner') {
        tasks.push(
          loadFinance(p).then(
            () => setFinanceError(false),
            (error) => {
              console.error('Dashboard: finance failed', error);
              setFinanceError(true);
            },
          ),
        );
      }
      await Promise.all(tasks);
      setUpdatedAt(new Date());
      setIsRefreshing(false);
      setIsFirstLoad(false);
    },
    [adminUser, loadOps, loadFinance],
  );

  useEffect(() => {
    void loadAll(period);
  }, [period, loadAll]);

  // Live: refetch shortly after a new enquiry / quote response arrives (debounced).
  const firstRevision = useRef(revision);
  useEffect(() => {
    if (revision === firstRevision.current) return undefined;
    const timer = setTimeout(() => void loadAll(period), 800);
    return () => clearTimeout(timer);
  }, [revision, period, loadAll]);

  // Keep "Updated x ago" honest.
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (isFirstLoad) {
    return (
      <AdminLayout adminUser={adminUser}>
        <DashboardPageSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
              {greeting}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Here's what's happening at Yahaya Travel &amp; Trade.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
              {updatedAt ? `Updated ${formatDistanceToNowStrict(updatedAt, { addSuffix: true })}` : ''}
            </span>
            <button
              type="button"
              onClick={() => void loadAll(period)}
              disabled={isRefreshing}
              className={`${btn('secondary')} !w-9 !px-0`}
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div
              role="radiogroup"
              aria-label="Time period"
              className="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-white/5"
            >
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={period === p.value}
                  aria-label={p.long}
                  onClick={() => setPeriod(p.value)}
                  className={`${segmentClass(period === p.value)} min-w-[3rem]`}
                >
                  {p.short}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className={`space-y-6 transition-opacity lg:space-y-8 ${isRefreshing ? 'opacity-70' : ''}`}>
          {/* Finance (owner only: finance tables are owner-only under RLS) */}
          {isOwner && (
            <section aria-labelledby="finance-heading" className="space-y-4">
              <SectionHeading id="finance-heading" title="Finance" subtitle={periodMeta.long} />
              {financeError || !finance ? (
                <ErrorCard message="Unable to load financial data. Confirm the Finance schema migration is applied, then refresh." />
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile label="Revenue" value={ngn.format(finance.revenue)} icon={Wallet} delta={finance.revenueDelta} goodWhen="up" comparison={periodMeta.previous} href="/admin/finance" />
                    <StatTile label="Expenses" value={ngn.format(finance.expenses)} icon={Receipt} delta={finance.expensesDelta} goodWhen="down" comparison={periodMeta.previous} href="/admin/expenses" />
                    <StatTile label="Net income" value={ngn.format(finance.net)} icon={finance.net >= 0 ? ArrowUpRight : ArrowDownRight} delta={finance.netDelta} goodWhen="up" comparison={periodMeta.previous} />
                    <StatTile
                      label="Profit margin"
                      value={finance.margin === null ? '—' : `${finance.margin.toFixed(1)}%`}
                      icon={CheckCircle2}
                      footnote={finance.margin === null ? 'No revenue in this period' : 'Net income ÷ revenue'}
                    />
                  </div>
                  <CashFlowCard data={cashFlow} periodLabel={periodMeta.long} />
                </>
              )}
            </section>
          )}

          {/* Operations */}
          <section aria-labelledby="ops-heading" className="space-y-4">
            <SectionHeading id="ops-heading" title="Operations" subtitle={periodMeta.long} />
            {opsError || !ops ? (
              <ErrorCard message="Unable to load operations data. Please refresh and try again." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="New enquiries" value={ops.enquiries.toLocaleString()} icon={Inbox} delta={ops.enquiriesDelta} goodWhen="up" comparison={periodMeta.previous} href="/admin/enquiries" />
                <StatTile label="Active clients" value={ops.activeClients.toLocaleString()} icon={Users} footnote="All time" href="/admin/clients" />
                <StatTile label="Awaiting client" value={ops.awaitingClient.toLocaleString()} icon={FileText} footnote="Quotes sent, no response yet" href="/admin/quotes" />
                <StatTile label="Quotes won" value={ops.won.toLocaleString()} icon={CheckCircle2} delta={ops.wonDelta} goodWhen="up" comparison={periodMeta.previous} href="/admin/quotes" />
              </div>
            )}
          </section>

          {/* Work queues */}
          <div className="grid gap-4 lg:grid-cols-5">
            <InboxCard items={inbox} total={newEnquiryCount} className="lg:col-span-3" />
            <ActivityCard notifications={notifications.slice(0, 6)} status={status} className="lg:col-span-2" />
          </div>

          <QuickActions isOwner={isOwner} />
        </div>
      </div>
    </AdminLayout>
  );
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

const card = 'rounded-xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.02] dark:border-white/10 dark:bg-gray-900';

function SectionHeading({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 id={id} className="text-base font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      {subtitle && <span className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</span>}
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
      {message}
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  delta,
  goodWhen,
  comparison,
  footnote,
  href,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: number | null;
  goodWhen?: 'up' | 'down';
  comparison?: string;
  footnote?: string;
  href?: string;
}) {
  const showDelta = delta !== undefined && goodWhen && comparison;
  let deltaNode: React.ReactNode = null;
  if (showDelta) {
    if (delta === null) {
      deltaNode = <span className="text-gray-500 dark:text-gray-400">No data for {comparison}</span>;
    } else {
      const flat = Math.abs(delta) < 0.05;
      const up = delta > 0;
      const good = flat ? null : (up && goodWhen === 'up') || (!up && goodWhen === 'down');
      const tone =
        good === null
          ? 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400'
          : good
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300';
      const Arrow = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
      deltaNode = (
        <>
          <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums ${tone}`}>
            <Arrow className="h-3 w-3" aria-hidden />
            <span className="sr-only">{flat ? 'No change' : up ? 'Up' : 'Down'}</span>
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="text-gray-500 dark:text-gray-400">vs {comparison}</span>
        </>
      );
    }
  }

  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200 dark:bg-white/5 dark:text-gray-400 dark:ring-white/10">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-gray-900 tabular-nums dark:text-white">{value}</p>
      <div className="mt-2 flex min-h-[1.5rem] flex-wrap items-center gap-1.5 text-xs">
        {deltaNode ?? <span className="text-gray-500 dark:text-gray-400">{footnote}</span>}
      </div>
    </>
  );

  return href ? (
    <Link
      to={href}
      className={`${card} group block p-5 transition-all hover:border-gray-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:border-white/20`}
    >
      {body}
    </Link>
  ) : (
    <div className={`${card} p-5`}>{body}</div>
  );
}

function CashFlowTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CashFlowPoint }> }) {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;
  const rows = [
    { key: 'revenue', label: 'Revenue', value: point.revenue, color: 'var(--color-revenue)' },
    { key: 'expenses', label: 'Expenses', value: point.expenses, color: 'var(--color-expenses)' },
  ];
  return (
    <div className="min-w-[11rem] rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-gray-900">
      <p className="mb-1.5 font-medium text-gray-900 dark:text-white">{point.label}</p>
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="h-0.5 w-3 rounded-full" style={{ background: row.color }} />
            {row.label}
          </span>
          <span className="font-semibold text-gray-900 tabular-nums dark:text-white">{ngn.format(row.value)}</span>
        </div>
      ))}
      <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-gray-100 pt-1.5 dark:border-white/5">
        <span className="text-gray-500 dark:text-gray-400">Net</span>
        <span className="font-semibold text-gray-900 tabular-nums dark:text-white">{ngn.format(point.net)}</span>
      </div>
    </div>
  );
}

function CashFlowCard({ data, periodLabel }: { data: CashFlowPoint[]; periodLabel: string }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const hasData = data.some((d) => d.revenue !== 0 || d.expenses !== 0);

  return (
    <div className={`${card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Cash flow</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Revenue and expenses, {periodLabel.toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-4">
          {hasData && view === 'chart' && (
            <ul className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300" aria-label="Legend">
              <li className="flex items-center gap-2">
                <span className="h-0.5 w-4 rounded-full bg-[#2a78d6] dark:bg-[#3987e5]" aria-hidden />
                Revenue
              </li>
              <li className="flex items-center gap-2">
                <span className="h-0.5 w-4 rounded-full bg-[#eb6834] dark:bg-[#d95926]" aria-hidden />
                Expenses
              </li>
            </ul>
          )}
          {hasData && (
            <div className="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-white/5" role="radiogroup" aria-label="Cash flow view">
              {([
                ['chart', LineChartIcon, 'Chart view'],
                ['table', Table2, 'Table view'],
              ] as const).map(([value, Icon, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={view === value}
                  aria-label={label}
                  onClick={() => setView(value)}
                  className={`${segmentClass(view === value)} !w-7 !px-0`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <LineChartIcon className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No transactions in this period</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Record income or expenses to see your cash flow.</p>
        </div>
      ) : view === 'chart' ? (
        <ChartContainer config={CHART_CONFIG} className="mt-4 aspect-auto h-72 w-full">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="0" className="stroke-gray-100 dark:stroke-white/5" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} className="text-[11px]" />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              tickMargin={4}
              className="text-[11px]"
              tickFormatter={(value: number) => ngnCompact.format(value)}
            />
            <ChartTooltip cursor={{ strokeWidth: 1 }} content={<CashFlowTooltip />} />
            <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} name="Revenue" />
            <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} name="Expenses" />
          </LineChart>
        </ChartContainer>
      ) : (
        <div className="mt-4 max-h-72 overflow-auto rounded-lg border border-gray-100 dark:border-white/5">
          <table className="w-full text-sm">
            <caption className="sr-only">Revenue, expenses and net income, {periodLabel.toLowerCase()}</caption>
            <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">Period</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Revenue</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Expenses</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {data.map((row) => (
                <tr key={row.key} className="text-gray-700 dark:text-gray-300">
                  <th scope="row" className="px-3 py-2 text-left font-normal">{row.label}</th>
                  <td className="px-3 py-2 text-right tabular-nums">{ngn.format(row.revenue)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{ngn.format(row.expenses)}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums text-gray-900 dark:text-white">{ngn.format(row.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const FORM_LABEL: Record<string, string> = { travel: 'Travel', trade: 'Trade', contact: 'Contact' };

function InboxCard({ items, total, className = '' }: { items: InboxItem[]; total: number; className?: string }) {
  return (
    <section aria-labelledby="inbox-heading" className={`${card} flex flex-col ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/5">
        <div>
          <h2 id="inbox-heading" className="text-sm font-semibold text-gray-900 dark:text-white">
            Needs a reply
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {total === 0 ? 'Every enquiry has been read' : `${total} new ${total === 1 ? 'enquiry' : 'enquiries'} waiting`}
          </p>
        </div>
        <Link to="/admin/enquiries" className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          Open inbox <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Inbox zero</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">New website enquiries will show up here instantly.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-white/5">
          {items.map((item) => (
            <li key={item.id}>
              <Link to="/admin/enquiries" className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  {(item.name?.trim()?.[0] ?? '?').toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.name || 'Unnamed'}</span>
                    <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-white/5 dark:text-gray-400">
                      {FORM_LABEL[item.form_type] ?? item.form_type}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
                    {item.message?.trim() || item.email || 'No message'}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
                  {formatDistanceToNowStrict(new Date(item.created_at), { addSuffix: true })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const ACTIVITY_ICON: Record<NotificationKind, { icon: LucideIcon; tone: string }> = {
  enquiry: { icon: Inbox, tone: 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-500/10' },
  quote_accepted: { icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10' },
  quote_declined: { icon: XCircle, tone: 'text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-500/10' },
  quote_revision: { icon: MessageSquareDiff, tone: 'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10' },
};

function ActivityCard({
  notifications,
  status,
  className = '',
}: {
  notifications: ReturnType<typeof useNotifications>['notifications'];
  status: ReturnType<typeof useNotifications>['status'];
  className?: string;
}) {
  return (
    <section aria-labelledby="activity-heading" className={`${card} flex flex-col ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/5">
        <div>
          <h2 id="activity-heading" className="text-sm font-semibold text-gray-900 dark:text-white">
            Recent activity
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Enquiries and quote responses, last 7 days</p>
        </div>
        <LiveIndicator status={status} compact />
      </div>
      {notifications.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-center text-xs text-gray-500 dark:text-gray-400">
          Nothing yet this week.
        </div>
      ) : (
        <ol className="relative px-5 py-4" aria-live="polite">
          {notifications.map((n, index) => {
            const { icon: Icon, tone } = ACTIVITY_ICON[n.kind];
            return (
              <li key={n.id} className="relative flex gap-3 pb-4 last:pb-0">
                {index < notifications.length - 1 && (
                  <span className="absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px bg-gray-200 dark:bg-white/10" aria-hidden />
                )}
                <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <Link to={n.link} className="min-w-0 flex-1 pt-0.5 hover:underline">
                  <span className="block text-sm text-gray-900 dark:text-white">{n.message}</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function QuickActions({ isOwner }: { isOwner: boolean }) {
  const actions: { label: string; hint: string; to: string; icon: LucideIcon; ownerOnly?: boolean }[] = [
    { label: 'New quote', hint: 'Price a trip or shipment', to: '/admin/quotes', icon: FileText },
    { label: 'New client', hint: 'Add a client record', to: '/admin/clients', icon: Users },
    { label: 'Record income', hint: 'Log a payment received', to: '/admin/finance', icon: Wallet, ownerOnly: true },
    { label: 'Record expense', hint: 'Log money spent', to: '/admin/expenses', icon: Receipt, ownerOnly: true },
  ];
  const visible = actions.filter((a) => isOwner || !a.ownerOnly);
  return (
    <section aria-labelledby="actions-heading" className="space-y-4">
      <SectionHeading id="actions-heading" title="Quick actions" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {visible.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className={`${card} group flex items-center gap-3 p-4 transition-all hover:border-gray-300 hover:shadow-md dark:hover:border-white/20`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900">
              <Plus className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-gray-900 dark:text-white">{a.label}</span>
              <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{a.hint}</span>
            </span>
            <a.icon className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500 dark:text-gray-600" />
          </Link>
        ))}
      </div>
    </section>
  );
}
