/**
 * Oil Trade overview: executive summary of one date range.
 *
 * Headline figures come straight from oil_trade_summary() (database-calculated).
 * The trend chart and recent transactions only re-group records the database has
 * already priced: sale amounts, the COGS the stock ledger assigned to each sale,
 * stock adjustment values and expenses. No business rules are recomputed here.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowRight,
  Boxes,
  LineChart as LineChartIcon,
  Package,
  ShoppingCart,
  Table2,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import {
  differenceInCalendarDays,
  differenceInCalendarYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachYearOfInterval,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { supabase } from '@/lib/supabase';
import {
  categoryLabel,
  fmtMoney,
  fmtMoneyCompact,
  fmtQty,
  oilQueries,
  type OilExpense,
  type OilPurchase,
  type OilSale,
  type OilTradeSummary,
  type ProductSummary,
} from '@/lib/oilTrade';
import { ErrorBanner, PaymentBadge, VoidedBadge, card, describeRange, summaryArgs, type DateRange } from './shared';

import { segmentClass } from '@/components/admin/ui';
// Validated categorical pair (dataviz reference palette, slots 1-2), stepped per theme.
const CHART_CONFIG = {
  revenue: { label: 'Sales revenue', theme: { light: '#2a78d6', dark: '#3987e5' } },
  net: { label: 'Net profit', theme: { light: '#eb6834', dark: '#d95926' } },
};

const num = (v: unknown) => Number(v ?? 0);
const fmtDate = (d: string) => format(parseISO(d), 'd MMM yyyy');

// ---------------------------------------------------------------------------
// Data for the analytics and recent activity (re-grouping only)
// ---------------------------------------------------------------------------

interface LedgerSlice {
  movement_type: 'sale' | 'adjustment';
  movement_date: string;
  value_change: number;
}

interface OverviewData {
  sales: OilSale[];
  purchases: OilPurchase[];
  expenses: OilExpense[];
  ledger: LedgerSlice[];
}

async function loadOverviewData(range: DateRange): Promise<OverviewData> {
  let ledgerQuery = supabase
    .from('oil_stock_ledger')
    .select('movement_type, movement_date, value_change')
    .in('movement_type', ['sale', 'adjustment']);
  if (range.from) ledgerQuery = ledgerQuery.gte('movement_date', range.from);
  if (range.to) ledgerQuery = ledgerQuery.lte('movement_date', range.to);

  const [sales, purchases, expenses, ledger] = await Promise.all([
    oilQueries.sales(range.from, range.to),
    oilQueries.purchases(range.from, range.to),
    oilQueries.expenses(range.from, range.to),
    ledgerQuery.then(({ data, error }) => {
      if (error) throw new Error(error.message);
      return (data ?? []) as LedgerSlice[];
    }),
  ]);
  return { sales, purchases, expenses, ledger };
}

interface TrendPoint {
  key: string;
  label: string;
  revenue: number;
  cogs: number;
  gross: number;
  expenses: number;
  adjustments: number;
  net: number;
}

type Grain = 'day' | 'week' | 'month' | 'year';
const GRAIN_LABEL: Record<Grain, string> = { day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' };

function buildTrend(data: OverviewData, range: DateRange): { points: TrendPoint[]; grain: Grain } {
  const [, cappedTo] = summaryArgs(range);
  const end = parseISO(cappedTo ?? format(new Date(), 'yyyy-MM-dd'));
  const dates = [
    ...data.sales.map((s) => s.transaction_date),
    ...data.expenses.map((e) => e.expense_date),
    ...data.ledger.map((l) => l.movement_date),
  ].sort();
  const start = parseISO(range.from ?? dates[0] ?? format(end, 'yyyy-MM-dd'));
  if (start > end) return { points: [], grain: 'day' };

  const days = differenceInCalendarDays(end, start);
  const grain: Grain = days <= 31 ? 'day' : days <= 120 ? 'week' : differenceInCalendarYears(end, start) > 4 ? 'year' : 'month';

  const keyOf = (d: Date) =>
    grain === 'day'
      ? format(d, 'yyyy-MM-dd')
      : grain === 'week'
        ? format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        : grain === 'month'
          ? format(startOfMonth(d), 'yyyy-MM')
          : format(startOfYear(d), 'yyyy');
  const buckets =
    grain === 'day'
      ? eachDayOfInterval({ start, end }).map((d) => ({ key: keyOf(d), label: format(d, days <= 7 ? 'EEE d' : 'd MMM') }))
      : grain === 'week'
        ? eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((d) => ({ key: keyOf(d), label: `w/c ${format(d, 'd MMM')}` }))
        : grain === 'month'
          ? eachMonthOfInterval({ start, end }).map((d) => ({ key: keyOf(d), label: format(d, 'MMM yy') }))
          : eachYearOfInterval({ start, end }).map((d) => ({ key: keyOf(d), label: format(d, 'yyyy') }));

  const totals = new Map(buckets.map((b) => [b.key, { revenue: 0, cogs: 0, expenses: 0, adjustments: 0 }]));
  const add = (date: string, field: 'revenue' | 'cogs' | 'expenses' | 'adjustments', value: number) => {
    const bucket = totals.get(keyOf(parseISO(date)));
    if (bucket) bucket[field] += value;
  };
  for (const s of data.sales) if (s.status === 'active') add(s.transaction_date, 'revenue', num(s.total_amount));
  for (const l of data.ledger) {
    if (l.movement_type === 'sale') add(l.movement_date, 'cogs', -num(l.value_change));
    else add(l.movement_date, 'adjustments', num(l.value_change));
  }
  for (const e of data.expenses) if (e.status === 'active') add(e.expense_date, 'expenses', num(e.amount));

  const points = buckets.map(({ key, label }) => {
    const t = totals.get(key)!;
    const gross = t.revenue - t.cogs;
    return { key, label, ...t, gross, net: gross - t.expenses + t.adjustments };
  });
  return { points, grain };
}

interface RecentRow {
  id: string;
  reference: string;
  type: 'Sale' | 'Purchase';
  product: string;
  quantity: number;
  unit: string;
  amount: number;
  date: string;
  createdAt: string;
  status: OilSale['status'];
  payment: OilSale['payment_status'];
  voidReason: string | null;
}

function recentTransactions(data: OverviewData, limit = 8): RecentRow[] {
  const rows: RecentRow[] = [
    ...data.sales.map((s) => ({
      id: s.id,
      reference: s.reference,
      type: 'Sale' as const,
      product: s.oil_products?.name ?? '—',
      quantity: num(s.quantity),
      unit: s.unit,
      amount: num(s.total_amount),
      date: s.transaction_date,
      createdAt: s.created_at,
      status: s.status,
      payment: s.payment_status,
      voidReason: s.void_reason,
    })),
    ...data.purchases.map((p) => ({
      id: p.id,
      reference: p.reference,
      type: 'Purchase' as const,
      product: p.oil_products?.name ?? '—',
      quantity: num(p.quantity),
      unit: p.unit,
      amount: num(p.total_cost),
      date: p.transaction_date,
      createdAt: p.created_at,
      status: p.status,
      payment: p.payment_status,
      voidReason: p.void_reason,
    })),
  ];
  return rows
    .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)))
    .slice(0, limit);
}

/** Sums a quantity per base unit; products in different units are never added together. */
function byUnit(products: ProductSummary[], pick: (p: ProductSummary) => number): [string, number][] {
  const totals = new Map<string, number>();
  for (const p of products) {
    const v = pick(p);
    if (v !== 0) totals.set(p.base_unit, (totals.get(p.base_unit) ?? 0) + v);
  }
  return Array.from(totals.entries());
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function OverviewTab({ summary, range, refreshKey }: { summary: OilTradeSummary; range: DateRange; refreshKey: number }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    loadOverviewData(range)
      .then((d) => active && setData(d))
      .catch((err: Error) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [range.from, range.to, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const t = summary.totals;
  const products = summary.products;
  const period = describeRange(range);
  const trend = useMemo(() => (data ? buildTrend(data, range) : null), [data, range]);
  const recent = useMemo(() => (data ? recentTransactions(data) : null), [data]);

  const purchaseCount = products.reduce((s, p) => s + num(p.purchase_count), 0);
  const saleCount = products.reduce((s, p) => s + num(p.sale_count), 0);
  const traded = products.filter((p) => num(p.purchase_count) > 0 || num(p.sale_count) > 0).length;
  const activeProducts = products.filter((p) => p.is_active).length;
  const revenue = num(t.revenue);
  const netMargin = revenue > 0 ? (num(t.net_profit) / revenue) * 100 : null;
  const grossMargin = revenue > 0 ? (num(t.gross_profit) / revenue) * 100 : null;

  return (
    <div className="space-y-8">
      {error && <ErrorBanner message={`Some charts could not load: ${error}`} />}

      {/* B. Financial performance */}
      <section aria-labelledby="perf-heading" className="space-y-3">
        <SectionTitle id="perf-heading" title="Financial performance" meta={period} />
        <div className={`${card} grid overflow-hidden lg:grid-cols-[1fr_1fr_minmax(0,0.9fr)]`}>
          <HeroMetric
            label="Sales revenue"
            value={fmtMoney(t.revenue)}
            detail={num(t.receivable) > 0 ? `${fmtMoney(t.receivable)} still to collect` : 'All sales in this period are paid'}
          />
          <HeroMetric
            label="Net profit"
            value={fmtMoney(t.net_profit)}
            negative={num(t.net_profit) < 0}
            badge={netMargin === null ? undefined : `${netMargin.toFixed(1)}% net margin`}
            detail={num(t.adjustments) !== 0 ? `Includes stock adjustments of ${fmtMoney(t.adjustments)}` : 'Gross profit less operating expenses'}
            divider
          />
          <dl className="divide-y divide-gray-100 border-t border-gray-100 bg-gray-50/50 dark:divide-white/5 dark:border-white/5 dark:bg-white/[0.02] lg:border-l lg:border-t-0">
            <SecondaryMetric label="Cost of goods sold" value={fmtMoney(t.cogs)} hint="Average cost of quantity sold" />
            <SecondaryMetric
              label="Gross profit"
              value={fmtMoney(t.gross_profit)}
              negative={num(t.gross_profit) < 0}
              hint={grossMargin === null ? 'Revenue less COGS' : `${grossMargin.toFixed(1)}% gross margin`}
            />
            <SecondaryMetric label="Operating expenses" value={fmtMoney(t.operating_expenses)} hint="Transport, storage, levies and more" />
          </dl>
        </div>
      </section>

      {/* C. Trade activity */}
      <section aria-labelledby="activity-heading" className="space-y-3">
        <SectionTitle id="activity-heading" title="Trade activity" meta={period} />
        <div className="grid gap-4 sm:grid-cols-3">
          <ActivityCard icon={Truck} label="Purchases" value={purchaseCount.toLocaleString()} detail={`${fmtMoney(t.purchase_cost)} total cost`} />
          <ActivityCard icon={ShoppingCart} label="Sales transactions" value={saleCount.toLocaleString()} detail={`${fmtMoney(t.revenue)} invoiced`} />
          <ActivityCard icon={Package} label="Products traded" value={traded.toLocaleString()} detail={`of ${activeProducts} active product${activeProducts === 1 ? '' : 's'}`} />
        </div>
      </section>

      {/* D. Inventory */}
      <section aria-labelledby="inventory-heading" className="space-y-3">
        <SectionTitle
          id="inventory-heading"
          title="Inventory"
          meta="Stock and valuation are current; quantities moved are for the selected period"
          action={<TabLink tab="inventory">View stock</TabLink>}
        />
        <div className={`${card} grid divide-y divide-gray-100 dark:divide-white/5 sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4`}>
          <InventoryStat label="Available stock" entries={byUnit(products, (p) => num(p.available_quantity))} className="sm:border-r sm:border-b xl:border-b-0" />
          <InventoryStat label="Inventory valuation" money={fmtMoney(t.inventory_value)} hint="Weighted average cost" className="sm:border-b xl:border-b-0 xl:border-r" />
          <InventoryStat label="Quantity purchased" entries={byUnit(products, (p) => num(p.quantity_purchased))} hint={period} className="sm:border-r xl:border-r" />
          <InventoryStat label="Quantity sold" entries={byUnit(products, (p) => num(p.quantity_sold))} hint={period} />
        </div>
      </section>

      {/* E. Performance analytics */}
      <section aria-labelledby="analytics-heading" className="space-y-3">
        <SectionTitle id="analytics-heading" title="Performance analytics" meta={period} />
        <TrendCard trend={trend} />
        <div className="grid gap-4 lg:grid-cols-2">
          <SalesByProduct products={products} />
          <ExpensesByCategory summary={summary} />
        </div>
      </section>

      {/* F. Recent transactions */}
      <section aria-labelledby="recent-heading" className="space-y-3">
        <SectionTitle
          id="recent-heading"
          title="Recent transactions"
          meta={period}
          action={
            <span className="flex gap-4">
              <TabLink tab="sales">All sales</TabLink>
              <TabLink tab="purchases">All purchases</TabLink>
            </span>
          }
        />
        <RecentTable rows={recent} />
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

function SectionTitle({ id, title, meta, action }: { id: string; title: string; meta?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h2 id={id} className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        {meta && <span className="text-xs text-gray-500 dark:text-gray-400">{meta}</span>}
      </div>
      {action}
    </div>
  );
}

function TabLink({ tab, q, children }: { tab: 'sales' | 'purchases' | 'inventory'; q?: string; children: ReactNode }) {
  return (
    <Link
      to="/admin/oil-trade"
      search={q ? { tab, q } : { tab }}
      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function HeroMetric({
  label,
  value,
  detail,
  badge,
  negative,
  divider,
}: {
  label: string;
  value: string;
  detail: string;
  badge?: string | undefined;
  negative?: boolean;
  divider?: boolean;
}) {
  return (
    <div className={`flex flex-col justify-between gap-4 p-6 ${divider ? 'border-t border-gray-100 dark:border-white/5 lg:border-l lg:border-t-0' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {badge && (
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-700 dark:bg-white/5 dark:text-gray-300">{badge}</span>
        )}
      </div>
      <p
        className={`break-words text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl ${
          negative ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{detail}</p>
    </div>
  );
}

function SecondaryMetric({ label, value, hint, negative }: { label: string; value: string; hint: string; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="min-w-0">
        <dt className="text-sm text-gray-600 dark:text-gray-300">{label}</dt>
        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      </div>
      <dd className={`shrink-0 text-base font-semibold tabular-nums ${negative ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>{value}</dd>
    </div>
  );
}

function ActivityCard({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return (
    <div className={`${card} flex h-full items-center gap-4 p-5`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200 dark:bg-white/5 dark:text-gray-400 dark:ring-white/10">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums text-gray-900 dark:text-white">{value}</p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{detail}</p>
      </div>
    </div>
  );
}

function InventoryStat({
  label,
  entries,
  money,
  hint,
  className = '',
}: {
  label: string;
  entries?: [string, number][];
  money?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`border-gray-100 p-5 dark:border-white/5 ${className}`}>
      <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Boxes className="h-4 w-4 text-gray-400" aria-hidden />
        {label}
      </p>
      {money !== undefined ? (
        <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">{money}</p>
      ) : entries && entries.length > 0 ? (
        <ul className="mt-2 space-y-0.5">
          {entries.map(([unit, qty]) => (
            <li key={unit} className="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {fmtQty(qty, unit)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">0</p>
      )}
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrendPoint }> }) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  const rows: [string, number, string?][] = [
    ['Sales revenue', p.revenue, 'var(--color-revenue)'],
    ['Cost of goods sold', -p.cogs],
    ['Gross profit', p.gross],
    ['Operating expenses', -p.expenses],
  ];
  if (p.adjustments !== 0) rows.push(['Stock adjustments', p.adjustments]);
  return (
    <div className="min-w-[13rem] rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-gray-900">
      <p className="mb-1.5 font-medium text-gray-900 dark:text-white">{p.label}</p>
      {rows.map(([label, value, color]) => (
        <div key={label} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            {color ? <span className="h-2 w-3 rounded-sm" style={{ background: color }} /> : <span className="w-3" />}
            {label}
          </span>
          <span className="tabular-nums text-gray-900 dark:text-white">{fmtMoney(value)}</span>
        </div>
      ))}
      <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-gray-100 pt-1.5 dark:border-white/5">
        <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
          <span className="h-0.5 w-3 rounded-full" style={{ background: 'var(--color-net)' }} />
          Net profit
        </span>
        <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{fmtMoney(p.net)}</span>
      </div>
    </div>
  );
}

function TrendCard({ trend }: { trend: { points: TrendPoint[]; grain: Grain } | null }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const hasData = !!trend && trend.points.some((p) => p.revenue !== 0 || p.expenses !== 0 || p.cogs !== 0 || p.adjustments !== 0);

  return (
    <div className={`${card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sales and profit trend</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{trend ? `${GRAIN_LABEL[trend.grain]} sales revenue with net profit` : 'Loading…'}</p>
        </div>
        {hasData && (
          <div className="flex items-center gap-4">
            {view === 'chart' && (
              <ul className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300" aria-label="Legend">
                <li className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#2a78d6] dark:bg-[#3987e5]" aria-hidden />
                  Sales revenue
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-0.5 w-4 rounded-full bg-[#eb6834] dark:bg-[#d95926]" aria-hidden />
                  Net profit
                </li>
              </ul>
            )}
            <div className="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-white/5" role="radiogroup" aria-label="Trend view">
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
          </div>
        )}
      </div>

      {!trend ? (
        <div className="mt-4 h-72 animate-pulse rounded-lg bg-gray-100 dark:bg-white/5" aria-busy="true" />
      ) : !hasData ? (
        <div className="flex h-72 flex-col items-center justify-center text-center">
          <LineChartIcon className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No sales or expenses in this period</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Record a sale to see the trend.</p>
        </div>
      ) : view === 'chart' ? (
        <ChartContainer config={CHART_CONFIG} className="mt-4 aspect-auto h-72 w-full">
          <ComposedChart data={trend.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} className="stroke-gray-100 dark:stroke-white/5" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} className="text-[11px]" />
            <YAxis tickLine={false} axisLine={false} width={68} tickMargin={4} className="text-[11px]" tickFormatter={(v: number) => fmtMoneyCompact(v)} />
            <ChartTooltip cursor={{ fillOpacity: 0.06 }} content={<TrendTooltip />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={36} name="Sales revenue" />
            <Line type="monotone" dataKey="net" stroke="var(--color-net)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} name="Net profit" />
          </ComposedChart>
        </ChartContainer>
      ) : (
        <div className="mt-4 max-h-72 overflow-auto rounded-lg border border-gray-100 dark:border-white/5">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">Sales revenue, cost of goods sold, expenses and net profit by period</caption>
            <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">Period</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Revenue</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">COGS</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Expenses</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Net profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {trend.points.map((p) => (
                <tr key={p.key} className="text-gray-700 dark:text-gray-300">
                  <th scope="row" className="px-3 py-2 text-left font-normal">{p.label}</th>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(p.revenue)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(p.cogs)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(p.expenses)}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums text-gray-900 dark:text-white">{fmtMoney(p.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SalesByProduct({ products }: { products: ProductSummary[] }) {
  const rows = products.filter((p) => num(p.revenue) > 0).sort((a, b) => num(b.revenue) - num(a.revenue));
  const total = rows.reduce((s, p) => s + num(p.revenue), 0);
  const max = Math.max(1, ...rows.map((p) => num(p.revenue)));
  return (
    <div className={`${card} flex h-full flex-col p-5`}>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sales by product</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">Revenue share and gross margin</p>
      {rows.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400">No sales in this period.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {rows.map((p) => {
            const margin = (num(p.gross_profit) / num(p.revenue)) * 100;
            return (
              <li key={p.product_id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-gray-800 dark:text-gray-200">{p.name}</span>
                  <span className="shrink-0 tabular-nums text-gray-900 dark:text-white">{fmtMoney(p.revenue)}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-gray-100 dark:bg-white/5">
                  <div className="h-2 rounded-full bg-[#2a78d6] dark:bg-[#3987e5]" style={{ width: `${(num(p.revenue) / max) * 100}%` }} />
                </div>
                <div className="mt-1 flex justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {fmtQty(p.quantity_sold, p.base_unit)} · {((num(p.revenue) / total) * 100).toFixed(1)}% of sales
                  </span>
                  <span className={margin < 0 ? 'text-rose-600 dark:text-rose-400' : ''}>{margin.toFixed(1)}% margin</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ExpensesByCategory({ summary }: { summary: OilTradeSummary }) {
  const rows = summary.expenses_by_category;
  const total = rows.reduce((s, c) => s + num(c.amount), 0);
  const max = Math.max(1, ...rows.map((c) => num(c.amount)));
  return (
    <div className={`${card} flex h-full flex-col p-5`}>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Expenses by category</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">{total > 0 ? `${fmtMoney(total)} in total` : 'Operating expenses'}</p>
      {rows.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400">No expenses in this period.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {rows.map((c) => (
            <li key={c.category}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-gray-800 dark:text-gray-200">{categoryLabel(c.category)}</span>
                <span className="shrink-0 tabular-nums text-gray-900 dark:text-white">{fmtMoney(c.amount)}</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-gray-100 dark:bg-white/5">
                <div className="h-2 rounded-full bg-gray-400 dark:bg-gray-500" style={{ width: `${(num(c.amount) / max) * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {c.count} {c.count === 1 ? 'entry' : 'entries'} · {((num(c.amount) / total) * 100).toFixed(1)}%
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecentTable({ rows }: { rows: RecentRow[] | null }) {
  if (!rows) return <div className={`${card} h-48 animate-pulse`} aria-busy="true" />;
  if (rows.length === 0) {
    return (
      <div className={`${card} px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400`}>No purchases or sales in this period.</div>
    );
  }
  const th = 'px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400';
  return (
    <div className={`${card} overflow-hidden`}>
      {/* Table on larger screens */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-white/5 dark:bg-white/[0.02]">
            <tr>
              <th className={th}>Reference</th>
              <th className={th}>Type</th>
              <th className={th}>Product</th>
              <th className={`${th} text-right`}>Quantity</th>
              <th className={`${th} text-right`}>Amount</th>
              <th className={th}>Date</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {rows.map((r) => (
              <tr key={r.id} className={`text-sm ${r.status === 'voided' ? 'opacity-60' : 'hover:bg-gray-50/60 dark:hover:bg-white/[0.02]'}`}>
                <td className="px-4 py-3">
                  <Link
                    to="/admin/oil-trade"
                    search={{ tab: r.type === 'Sale' ? 'sales' : 'purchases', q: r.reference }}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {r.reference}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <TypeTag type={r.type} />
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.product}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">{fmtQty(r.quantity, r.unit)}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-gray-900 dark:text-white">{fmtMoney(r.amount)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">{fmtDate(r.date)}</td>
                <td className="px-4 py-3">
                  {r.status === 'voided' ? <VoidedBadge status={r.status} reason={r.voidReason} /> : <PaymentBadge status={r.payment} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stacked list on phones (no horizontal scroll) */}
      <ul className="divide-y divide-gray-100 md:hidden dark:divide-white/5">
        {rows.map((r) => (
          <li key={r.id} className={r.status === 'voided' ? 'opacity-60' : ''}>
            <Link
              to="/admin/oil-trade"
              search={{ tab: r.type === 'Sale' ? 'sales' : 'purchases', q: r.reference }}
              className="block px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                  {r.reference} <TypeTag type={r.type} />
                </span>
                <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{fmtMoney(r.amount)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="truncate">
                  {r.product} · {fmtQty(r.quantity, r.unit)} · {fmtDate(r.date)}
                </span>
                {r.status === 'voided' ? <VoidedBadge status={r.status} reason={r.voidReason} /> : <PaymentBadge status={r.payment} />}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TypeTag({ type }: { type: 'Sale' | 'Purchase' }) {
  return (
    <span className="inline-flex rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/5 dark:text-gray-400">
      {type}
    </span>
  );
}
