import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useCallback, useContext, useEffect, useState } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAuthContext } from '@/components/admin/AdminAuthContext';
import { TablePageSkeleton } from '@/components/admin/SkeletonLoader';
import { ThemeProvider } from '@/lib/theme';
import { checkAdminAccess, type AdminUser } from '@/lib/auth';
import { oilApi, oilQueries, type InventoryStatus, type OilProduct, type OilTradeSummary } from '@/lib/oilTrade';
import { DateRangeFilter, ErrorBanner, LoadingRows, rangeFor, summaryArgs, type DateRange } from '@/components/admin/oil-trade/shared';
import { OverviewTab } from '@/components/admin/oil-trade/OverviewTab';
import { TransactionsTab } from '@/components/admin/oil-trade/TransactionsTab';
import { ExpensesTab } from '@/components/admin/oil-trade/ExpensesTab';
import { InventoryTab } from '@/components/admin/oil-trade/InventoryTab';
import { ProductsTab } from '@/components/admin/oil-trade/ProductsTab';
import { ReportsTab } from '@/components/admin/oil-trade/ReportsTab';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'sales', label: 'Sales' },
  { value: 'purchases', label: 'Purchases' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'products', label: 'Products' },
  { value: 'reports', label: 'Reports' },
] as const;
type Tab = (typeof TABS)[number]['value'];

export const Route = createFileRoute('/admin/oil-trade')({
  // The admin session lives in localStorage, so auth can only be checked in the browser.
  ssr: false,
  // `q` pre-fills the search box on Sales/Purchases (used by "view" links on the overview).
  validateSearch: (search: Record<string, unknown>): { tab?: Tab; q?: string } => {
    const tab = TABS.find((t) => t.value === search['tab'])?.value;
    const q = typeof search['q'] === 'string' ? search['q'].slice(0, 100) : undefined;
    return {
      ...(tab && tab !== 'overview' ? { tab } : {}),
      ...(q ? { q } : {}),
    };
  },
  beforeLoad: async ({ location }) => {
    const result = await checkAdminAccess();
    if (!result.isAdmin) {
      throw redirect({ to: '/admin/login', search: { redirect: location.href } });
    }
  },
  component: () => (
    <ThemeProvider>
      <AdminGuard>
        <OilTradePage />
      </AdminGuard>
    </ThemeProvider>
  ),
});

function OilTradePage() {
  const sharedAuth = useContext(AdminAuthContext);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(sharedAuth?.user ?? null);
  const { tab = 'overview', q } = Route.useSearch();
  const navigate = useNavigate({ from: '/admin/oil-trade' });

  const [range, setRange] = useState<DateRange>(() => rangeFor('month'));
  const [products, setProducts] = useState<OilProduct[]>([]);
  const [inventory, setInventory] = useState<InventoryStatus[]>([]);
  const [summary, setSummary] = useState<OilTradeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (adminUser) return;
    void checkAdminAccess().then(({ user }) => setAdminUser(user ?? null));
  }, [adminUser]);

  const isOwner = adminUser?.role === 'owner';

  const loadShared = useCallback(async () => {
    setError(null);
    try {
      const [from, to] = summaryArgs(range);
      const [p, i, s] = await Promise.all([oilQueries.products(), oilQueries.inventory(), oilApi.summary(from, to)]);
      setProducts(p);
      setInventory(i);
      setSummary(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load oil trade data');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    if (isOwner) void loadShared();
  }, [isOwner, loadShared, refreshKey]);

  const onChanged = () => setRefreshKey((k) => k + 1);

  if (!adminUser) {
    return (
      <AdminLayout adminUser={adminUser}>
        <TablePageSkeleton />
      </AdminLayout>
    );
  }

  if (!isOwner) {
    return (
      <AdminLayout adminUser={adminUser}>
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          Oil Trade is limited to owners, like Finance. Ask an owner if you need a report.
        </div>
      </AdminLayout>
    );
  }

  const showsRange = tab !== 'products';

  return (
    <AdminLayout adminUser={adminUser}>
      <div className="space-y-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-white">Oil Trade</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Petroleum purchases, sales, inventory and profitability.</p>
          </div>
          {showsRange && <DateRangeFilter value={range} onChange={setRange} />}
        </header>

        <nav aria-label="Oil trade sections" className="-mb-px flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-white/10">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-current={tab === t.value ? 'page' : undefined}
              onClick={() => void navigate({ search: t.value === 'overview' ? {} : { tab: t.value } })}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === t.value
                  ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {error && <ErrorBanner message={error} onRetry={() => void loadShared()} />}

        {loading ? (
          <LoadingRows />
        ) : error && products.length === 0 ? null : (
          <>
            {tab === 'overview' && summary && <OverviewTab summary={summary} range={range} refreshKey={refreshKey} />}
            {(tab === 'sales' || tab === 'purchases') && (
              <TransactionsTab
                kind={tab === 'sales' ? 'sale' : 'purchase'}
                initialQuery={q ?? ''}
                range={range}
                products={products}
                inventory={inventory}
                refreshKey={refreshKey}
                onChanged={onChanged}
              />
            )}
            {tab === 'expenses' && <ExpensesTab range={range} products={products} refreshKey={refreshKey} onChanged={onChanged} />}
            {tab === 'inventory' && (
              <InventoryTab range={range} products={products} inventory={inventory} refreshKey={refreshKey} onChanged={onChanged} />
            )}
            {tab === 'products' && <ProductsTab products={products} onChanged={onChanged} />}
            {tab === 'reports' && <ReportsTab range={range} products={products} summary={summary} />}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
