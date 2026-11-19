import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  categoryLabel,
  fmtMoney,
  fmtQty,
  oilQueries,
  UNIT_LABEL,
  type OilExpense,
  type OilProduct,
  type OilPurchase,
  type OilSale,
  type OilTradeSummary,
} from '@/lib/oilTrade';
import { exportPdf, exportXlsx, type ReportCell, type ReportTable } from '@/lib/reportExport';
import { EmptyState, ErrorBanner, LoadingRows, card, describeRange, inputClass, secondaryButton, td, tdRight, th, thRight, type DateRange } from './shared';

type ReportKind = 'pnl' | 'profitability' | 'inventory' | 'sales' | 'purchases' | 'expenses';

const REPORTS: { value: ReportKind; label: string; description: string }[] = [
  { value: 'pnl', label: 'Profit and loss', description: 'Revenue, cost of goods sold, expenses and net profit' },
  { value: 'profitability', label: 'Product profitability', description: 'Revenue, COGS and profit for each product' },
  { value: 'inventory', label: 'Inventory', description: 'Opening stock, movements, closing stock and value' },
  { value: 'sales', label: 'Sales', description: 'Every active sale with payments' },
  { value: 'purchases', label: 'Purchases', description: 'Every active purchase with payments' },
  { value: 'expenses', label: 'Expenses', description: 'Every active operating expense' },
];

const unitName = (u: string) => UNIT_LABEL[u as keyof typeof UNIT_LABEL]?.plural ?? u;
const num = (v: unknown) => Number(v ?? 0);
const PAYMENT = { paid: 'Paid', partial: 'Part paid', unpaid: 'Unpaid' } as const;

export function ReportsTab({ range, products, summary }: { range: DateRange; products: OilProduct[]; summary: OilTradeSummary | null }) {
  const [kind, setKind] = useState<ReportKind>('pnl');
  const [productFilter, setProductFilter] = useState('all');
  const [sales, setSales] = useState<OilSale[] | null>(null);
  const [purchases, setPurchases] = useState<OilPurchase[] | null>(null);
  const [expenses, setExpenses] = useState<OilExpense[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSales(null);
    setPurchases(null);
    setExpenses(null);
  }, [range.from, range.to]);

  useEffect(() => {
    const needs = kind === 'sales' ? sales === null : kind === 'purchases' ? purchases === null : kind === 'expenses' ? expenses === null : false;
    if (!needs) return;
    setLoading(true);
    setError(null);
    const task =
      kind === 'sales'
        ? oilQueries.sales(range.from, range.to).then(setSales)
        : kind === 'purchases'
          ? oilQueries.purchases(range.from, range.to).then(setPurchases)
          : oilQueries.expenses(range.from, range.to).then(setExpenses);
    task.catch((err: Error) => setError(err.message)).finally(() => setLoading(false));
  }, [kind, range.from, range.to, sales, purchases, expenses]);

  const productName = products.find((p) => p.id === productFilter)?.name;
  const period = describeRange(range);

  const report: ReportTable | null = useMemo(() => {
    const subtitle = `${period}${productName ? ` · ${productName}` : ''}`;
    const productRows = (summary?.products ?? []).filter((p) => productFilter === 'all' || p.product_id === productFilter);

    switch (kind) {
      case 'pnl': {
        if (!summary) return null;
        const t = summary.totals;
        const rows: Record<string, ReportCell>[] = [
          { line: 'Sales revenue', amount: num(t.revenue) },
          { line: 'Less: cost of goods sold', amount: -num(t.cogs) },
          { line: 'Gross profit', amount: num(t.gross_profit) },
          ...summary.expenses_by_category.map((c) => ({ line: `Less: ${categoryLabel(c.category)}`, amount: -num(c.amount) })),
          { line: 'Total operating expenses', amount: -num(t.operating_expenses) },
        ];
        if (num(t.adjustments) !== 0) rows.push({ line: 'Stock adjustments (losses / gains)', amount: num(t.adjustments) });
        return {
          title: 'Oil trade profit and loss',
          subtitle: period,
          columns: [
            { key: 'line', label: 'Line' },
            { key: 'amount', label: 'Amount (NGN)', type: 'money' },
          ],
          rows,
          totals: { line: 'Net profit', amount: num(t.net_profit) },
        };
      }
      case 'profitability': {
        if (!summary) return null;
        const rows = productRows
          .filter((p) => p.sale_count > 0 || num(p.direct_expenses) !== 0 || num(p.adjustment_value) !== 0)
          .map((p) => ({
            product: p.name,
            unit: unitName(p.base_unit),
            qty: num(p.quantity_sold),
            revenue: num(p.revenue),
            cogs: num(p.cogs),
            gross: num(p.gross_profit),
            expenses: num(p.direct_expenses),
            adjustments: num(p.adjustment_value),
            net: num(p.net_profit),
            margin: num(p.revenue) > 0 ? `${((num(p.gross_profit) / num(p.revenue)) * 100).toFixed(1)}%` : '—',
          }));
        const sum = (k: keyof (typeof rows)[number]) => rows.reduce((s, r) => s + Number(r[k] as number), 0);
        return {
          title: 'Oil trade product profitability',
          subtitle,
          columns: [
            { key: 'product', label: 'Product' },
            { key: 'unit', label: 'Unit' },
            { key: 'qty', label: 'Quantity sold', type: 'number' },
            { key: 'revenue', label: 'Revenue', type: 'money' },
            { key: 'cogs', label: 'COGS', type: 'money' },
            { key: 'gross', label: 'Gross profit', type: 'money' },
            { key: 'expenses', label: 'Direct expenses', type: 'money' },
            { key: 'adjustments', label: 'Adjustments', type: 'money' },
            { key: 'net', label: 'Product net', type: 'money' },
            { key: 'margin', label: 'Gross margin' },
          ],
          rows,
          totals: rows.length
            ? { product: 'Total', revenue: sum('revenue'), cogs: sum('cogs'), gross: sum('gross'), expenses: sum('expenses'), adjustments: sum('adjustments'), net: sum('net') }
            : undefined,
        };
      }
      case 'inventory': {
        if (!summary) return null;
        const rows = productRows.map((p) => ({
          product: p.name,
          unit: unitName(p.base_unit),
          opening: num(p.opening_quantity),
          openingValue: num(p.opening_value),
          purchased: num(p.quantity_purchased),
          sold: num(p.quantity_sold),
          adjusted: num(p.adjustment_quantity),
          closing: num(p.closing_quantity),
          closingValue: num(p.closing_value),
          cogs: num(p.cogs),
        }));
        return {
          title: 'Oil trade inventory',
          subtitle: `${subtitle} · weighted average cost`,
          columns: [
            { key: 'product', label: 'Product' },
            { key: 'unit', label: 'Unit' },
            { key: 'opening', label: 'Opening qty', type: 'number' },
            { key: 'openingValue', label: 'Opening value', type: 'money' },
            { key: 'purchased', label: 'Purchased', type: 'number' },
            { key: 'sold', label: 'Sold', type: 'number' },
            { key: 'adjusted', label: 'Adjustments', type: 'number' },
            { key: 'closing', label: 'Closing qty', type: 'number' },
            { key: 'closingValue', label: 'Closing value', type: 'money' },
            { key: 'cogs', label: 'COGS', type: 'money' },
          ],
          rows,
          totals: rows.length
            ? {
                product: 'Total value',
                openingValue: rows.reduce((s, r) => s + r.openingValue, 0),
                closingValue: rows.reduce((s, r) => s + r.closingValue, 0),
                cogs: rows.reduce((s, r) => s + r.cogs, 0),
              }
            : undefined,
        };
      }
      case 'sales':
      case 'purchases': {
        const list = (kind === 'sales' ? sales : purchases) as (OilSale | OilPurchase)[] | null;
        if (!list) return null;
        const rows = list
          .filter((r) => r.status === 'active' && (productFilter === 'all' || r.product_id === productFilter))
          .map((r) => {
            const totalValue = 'customer' in r ? num(r.total_amount) : num(r.total_cost);
            return {
              reference: r.reference,
              date: r.transaction_date,
              product: r.oil_products?.name ?? '',
              party: 'customer' in r ? r.customer : r.supplier,
              qty: num(r.quantity),
              unit: unitName(r.unit),
              price: num(r.unit_price),
              total: totalValue,
              paid: num(r.amount_paid),
              outstanding: totalValue - num(r.amount_paid),
              payment: PAYMENT[r.payment_status],
              external: r.external_ref ?? '',
            };
          });
        return {
          title: kind === 'sales' ? 'Oil trade sales' : 'Oil trade purchases',
          subtitle,
          columns: [
            { key: 'reference', label: 'Reference' },
            { key: 'date', label: 'Date' },
            { key: 'product', label: 'Product' },
            { key: 'party', label: kind === 'sales' ? 'Customer' : 'Supplier' },
            { key: 'qty', label: 'Quantity', type: 'number' },
            { key: 'unit', label: 'Unit' },
            { key: 'price', label: 'Unit price', type: 'money' },
            { key: 'total', label: 'Total', type: 'money' },
            { key: 'paid', label: 'Paid', type: 'money' },
            { key: 'outstanding', label: 'Outstanding', type: 'money' },
            { key: 'payment', label: 'Payment' },
            { key: 'external', label: kind === 'sales' ? 'Invoice / waybill' : 'Supplier ref' },
          ],
          rows,
          totals: rows.length
            ? {
                reference: `${rows.length} records`,
                total: rows.reduce((s, r) => s + r.total, 0),
                paid: rows.reduce((s, r) => s + r.paid, 0),
                outstanding: rows.reduce((s, r) => s + r.outstanding, 0),
              }
            : undefined,
        };
      }
      case 'expenses': {
        if (!expenses) return null;
        const rows = expenses
          .filter((e) => e.status === 'active' && (productFilter === 'all' || e.product_id === productFilter))
          .map((e) => ({
            reference: e.reference,
            date: e.expense_date,
            category: categoryLabel(e.category),
            description: e.description,
            linked: e.oil_purchases ? `Purchase ${e.oil_purchases.reference}` : e.oil_sales ? `Sale ${e.oil_sales.reference}` : e.oil_products?.name ?? 'General',
            payee: e.payee ?? '',
            amount: num(e.amount),
          }));
        return {
          title: 'Oil trade expenses',
          subtitle,
          columns: [
            { key: 'reference', label: 'Reference' },
            { key: 'date', label: 'Date' },
            { key: 'category', label: 'Category' },
            { key: 'description', label: 'Description' },
            { key: 'linked', label: 'Linked to' },
            { key: 'payee', label: 'Paid to' },
            { key: 'amount', label: 'Amount', type: 'money' },
          ],
          rows,
          totals: rows.length ? { reference: `${rows.length} records`, amount: rows.reduce((s, r) => s + r.amount, 0) } : undefined,
        };
      }
    }
  }, [kind, summary, sales, purchases, expenses, productFilter, productName, period]);

  const showProductFilter = kind !== 'pnl';
  const meta = REPORTS.find((r) => r.value === kind)!;

  const render = (value: ReportCell, type?: string, unit?: string) => {
    if (value === null || value === '') return '—';
    if (typeof value === 'number') return type === 'money' ? fmtMoney(value) : fmtQty(value, unit);
    return value;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select value={kind} onChange={(e) => setKind(e.target.value as ReportKind)} className={`${inputClass} w-auto`} aria-label="Report">
            {REPORTS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {showProductFilter && (
            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className={`${inputClass} w-auto`} aria-label="Product">
              <option value="all">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={secondaryButton}
            disabled={!report}
            onClick={() => {
              if (!report) return;
              exportXlsx(report);
              toast.success('Excel file downloaded');
            }}
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button
            type="button"
            className={secondaryButton}
            disabled={!report}
            onClick={() => {
              if (!report) return;
              exportPdf(report);
              toast.success('PDF downloaded');
            }}
          >
            <FileText className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className={`${card} overflow-hidden`}>
        <div className="border-b border-gray-100 px-5 py-4 dark:border-white/5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{report?.title ?? meta.label}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {meta.description} · {report?.subtitle ?? period} · voided records excluded
          </p>
        </div>
        {loading || !report ? (
          <LoadingRows />
        ) : report.rows.length === 0 ? (
          <EmptyState title="Nothing to report" body="No records match this period and filter." />
        ) : (
          <div className="max-h-[36rem] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 border-b border-gray-100 bg-gray-50 dark:border-white/5 dark:bg-gray-900">
                <tr>
                  {report.columns.map((c) => (
                    <th key={c.key} className={c.type === 'money' || c.type === 'number' ? thRight : th}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {report.rows.map((row, i) => (
                  <tr key={i}>
                    {report.columns.map((c) => (
                      <td key={c.key} className={c.type === 'money' || c.type === 'number' ? tdRight : `${td} whitespace-nowrap`}>
                        {render(row[c.key] ?? null, c.type)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {report.totals && (
                <tfoot className="border-t-2 border-gray-200 bg-gray-50/60 dark:border-white/10 dark:bg-white/[0.02]">
                  <tr>
                    {report.columns.map((c) => (
                      <td key={c.key} className={`${c.type === 'money' || c.type === 'number' ? tdRight : td} font-semibold text-gray-900 dark:text-white`}>
                        {report.totals?.[c.key] === undefined ? '' : render(report.totals[c.key] ?? null, c.type)}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
