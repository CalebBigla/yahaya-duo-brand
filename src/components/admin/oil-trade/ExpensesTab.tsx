import { useEffect, useMemo, useState } from 'react';
import { Ban, Pencil, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  EXPENSE_CATEGORIES,
  categoryLabel,
  fmtMoney,
  oilApi,
  oilQueries,
  type ExpenseCategory,
  type OilExpense,
  type OilProduct,
} from '@/lib/oilTrade';
import {
  EmptyState,
  ErrorBanner,
  Field,
  FormError,
  LoadingRows,
  Modal,
  SubmitButton,
  VoidDialog,
  VoidedBadge,
  card,
  describeRange,
  iconButton,
  inputClass,
  primaryButton,
  secondaryButton,
  td,
  tdRight,
  th,
  thRight,
  todayIso,
  useIdempotencyKey,
  type DateRange,
} from './shared';

const fmtDate = (d: string) => format(new Date(`${d}T12:00:00`), 'd MMM yyyy');

function linkLabel(e: OilExpense) {
  if (e.oil_purchases) return `Purchase ${e.oil_purchases.reference}`;
  if (e.oil_sales) return `Sale ${e.oil_sales.reference}`;
  if (e.oil_products) return e.oil_products.name;
  return 'General';
}

export function ExpensesTab({
  range,
  products,
  refreshKey,
  onChanged,
}: {
  range: DateRange;
  products: OilProduct[];
  refreshKey: number;
  onChanged: () => void;
}) {
  const [rows, setRows] = useState<OilExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | ExpenseCategory>('all');
  const [showVoided, setShowVoided] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OilExpense | null>(null);
  const [voiding, setVoiding] = useState<OilExpense | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await oilQueries.expenses(range.from, range.to));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to, refreshKey]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (!showVoided && r.status === 'voided') return false;
      if (category !== 'all' && r.category !== category) return false;
      if (q && ![r.reference, r.description, r.payee ?? '', linkLabel(r)].some((v) => v.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, query, category, showVoided]);
  const sum = visible.filter((r) => r.status === 'active').reduce((s, r) => s + Number(r.amount), 0);

  const afterChange = () => onChanged();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search expenses…" className={`${inputClass} w-56 pl-9`} aria-label="Search expenses" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value as 'all' | ExpenseCategory)} className={`${inputClass} w-auto`} aria-label="Category">
            <option value="all">All categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={showVoided} onChange={(e) => setShowVoided(e.target.checked)} className="rounded border-gray-300" />
            Show voided
          </label>
        </div>
        <button
          type="button"
          className={primaryButton}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Record expense
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => void load()} />}

      <div className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 text-xs text-gray-500 dark:border-white/5 dark:text-gray-400">
          <span>{describeRange(range)}</span>
          <span className="tabular-nums">Total {fmtMoney(sum)}</span>
        </div>
        {loading ? (
          <LoadingRows />
        ) : visible.length === 0 ? (
          <EmptyState title="No expenses" body={rows.length ? 'Nothing matches these filters.' : 'Transport, storage, levies and other oil trade costs go here.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-white/5 dark:bg-white/[0.02]">
                <tr>
                  <th className={th}>Reference</th>
                  <th className={th}>Date</th>
                  <th className={th}>Category</th>
                  <th className={th}>Description</th>
                  <th className={th}>Linked to</th>
                  <th className={thRight}>Amount</th>
                  <th className={thRight}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {visible.map((r) => {
                  const voided = r.status === 'voided';
                  return (
                    <tr key={r.id} className={voided ? 'opacity-50' : 'hover:bg-gray-50/60 dark:hover:bg-white/[0.02]'}>
                      <td className={td}>
                        <div className="font-medium text-gray-900 dark:text-white">{r.reference}</div>
                        <VoidedBadge status={r.status} reason={r.void_reason} />
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{fmtDate(r.expense_date)}</td>
                      <td className={td}>{categoryLabel(r.category)}</td>
                      <td className={`${td} max-w-[16rem]`}>
                        <div className="truncate" title={r.description}>
                          {r.description}
                        </div>
                        {r.payee && <div className="truncate text-xs text-gray-500">{r.payee}</div>}
                      </td>
                      <td className={td}>{linkLabel(r)}</td>
                      <td className={`${tdRight} font-medium text-gray-900 dark:text-white`}>{fmtMoney(r.amount)}</td>
                      <td className={`${td} text-right`}>
                        {!voided && (
                          <div className="inline-flex gap-0.5">
                            <button
                              type="button"
                              className={iconButton}
                              title="Edit"
                              aria-label={`Edit ${r.reference}`}
                              onClick={() => {
                                setEditing(r);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button type="button" className={iconButton} title="Void" aria-label={`Void ${r.reference}`} onClick={() => setVoiding(r)}>
                              <Ban className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        products={products}
        onSaved={() => {
          setFormOpen(false);
          afterChange();
        }}
      />
      <VoidDialog
        open={voiding !== null}
        onOpenChange={(open) => !open && setVoiding(null)}
        title={`Void ${voiding?.reference ?? ''}`}
        description="The expense stops counting towards operating expenses and net profit."
        onConfirm={async (reason) => {
          if (!voiding) return;
          await oilApi.voidRecord('expense', voiding.id, reason);
          toast.success(`${voiding.reference} voided`);
          setVoiding(null);
          afterChange();
        }}
      />
    </div>
  );
}

type LinkKind = 'none' | 'product' | 'purchase' | 'sale';

interface Linkable {
  id: string;
  reference: string;
  transaction_date: string;
  name: string;
  code: string;
}

function ExpenseForm({
  open,
  onOpenChange,
  record,
  products,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: OilExpense | null;
  products: OilProduct[];
  onSaved: () => void;
}) {
  const idempotencyKey = useIdempotencyKey(open);
  const [category, setCategory] = useState<ExpenseCategory>('transportation');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [payee, setPayee] = useState('');
  const [externalRef, setExternalRef] = useState('');
  const [notes, setNotes] = useState('');
  const [linkKind, setLinkKind] = useState<LinkKind>('none');
  const [linkId, setLinkId] = useState('');
  const [linkable, setLinkable] = useState<{ purchases: Linkable[]; sales: Linkable[] }>({ purchases: [], sales: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setCategory(record?.category ?? 'transportation');
    setDescription(record?.description ?? '');
    setAmount(record ? String(Number(record.amount)) : '');
    setDate(record?.expense_date ?? todayIso());
    setPayee(record?.payee ?? '');
    setExternalRef(record?.external_ref ?? '');
    setNotes(record?.notes ?? '');
    if (record?.purchase_id) {
      setLinkKind('purchase');
      setLinkId(record.purchase_id);
    } else if (record?.sale_id) {
      setLinkKind('sale');
      setLinkId(record.sale_id);
    } else if (record?.product_id) {
      setLinkKind('product');
      setLinkId(record.product_id);
    } else {
      setLinkKind('none');
      setLinkId('');
    }
    oilQueries
      .linkable()
      .then(({ purchases, sales }) =>
        setLinkable({
          purchases: purchases.map((p) => ({ id: p.id, reference: p.reference, transaction_date: p.transaction_date, name: p.supplier, code: p.oil_products?.code ?? '' })),
          sales: sales.map((s) => ({ id: s.id, reference: s.reference, transaction_date: s.transaction_date, name: s.customer, code: s.oil_products?.code ?? '' })),
        }),
      )
      .catch(() => setLinkable({ purchases: [], sales: [] }));
  }, [open, record]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (linkKind !== 'none' && !linkId) {
      setError('Choose what this expense is linked to, or select "Not linked".');
      return;
    }
    setBusy(true);
    try {
      const result = await oilApi.saveExpense({
        id: record?.id ?? null,
        idempotency_key: record ? null : idempotencyKey,
        category,
        description: description.trim(),
        amount: Number(amount),
        expense_date: date,
        payee: payee.trim() || null,
        external_ref: externalRef.trim() || null,
        notes: notes.trim() || null,
        product_id: linkKind === 'product' ? linkId : null,
        purchase_id: linkKind === 'purchase' ? linkId : null,
        sale_id: linkKind === 'sale' ? linkId : null,
      });
      toast.success(result.duplicate ? `${result.reference} was already saved` : `${result.reference} ${record ? 'updated' : 'recorded'}`);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save the expense');
    } finally {
      setBusy(false);
    }
  };

  const options: Linkable[] = linkKind === 'purchase' ? linkable.purchases : linkKind === 'sale' ? linkable.sales : [];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={record ? `Edit ${record.reference}` : 'Record expense'}
      description="Operating expenses reduce net profit in the period they are dated."
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <SubmitButton busy={busy} form="expense-form">
            {record ? 'Save changes' : 'Record expense'}
          </SubmitButton>
        </>
      }
    >
      <form id="expense-form" onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" required>
            <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={inputClass}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount (₦)" required>
            <input type="number" inputMode="decimal" min="0.01" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required className={inputClass} />
          </Field>
        </div>
        <Field label="Description" required>
          <input value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={300} placeholder="e.g. Truck hire, Lagos to Kano" className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" required>
            <input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
          </Field>
          <Field label="Paid to">
            <input value={payee} onChange={(e) => setPayee(e.target.value)} maxLength={200} className={inputClass} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Linked to" hint="Linking attributes the cost to a product in the profitability report.">
            <select
              value={linkKind}
              onChange={(e) => {
                setLinkKind(e.target.value as LinkKind);
                setLinkId('');
              }}
              className={inputClass}
            >
              <option value="none">Not linked (general)</option>
              <option value="product">A product</option>
              <option value="purchase">A purchase</option>
              <option value="sale">A sale</option>
            </select>
          </Field>
          {linkKind === 'product' && (
            <Field label="Product" required>
              <select value={linkId} onChange={(e) => setLinkId(e.target.value)} className={inputClass} required>
                <option value="">Choose…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {(linkKind === 'purchase' || linkKind === 'sale') && (
            <Field label={linkKind === 'purchase' ? 'Purchase' : 'Sale'} required>
              <select value={linkId} onChange={(e) => setLinkId(e.target.value)} className={inputClass} required>
                <option value="">Choose…</option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.reference} · {o.code} · {o.name} · {fmtDate(o.transaction_date)}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Receipt / reference">
            <input value={externalRef} onChange={(e) => setExternalRef(e.target.value)} maxLength={100} className={inputClass} />
          </Field>
          <Field label="Notes">
            <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} className={inputClass} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
