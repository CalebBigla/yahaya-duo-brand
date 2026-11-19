import { useEffect, useMemo, useRef, useState } from 'react';
import { Banknote, Ban, Paperclip, Pencil, Plus, Search, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  fmtMoney,
  fmtQty,
  fromBase,
  oilApi,
  oilQueries,
  openAttachment,
  removeAttachments,
  unitsFor,
  UNIT_LABEL,
  uploadPurchaseAttachment,
  type InventoryStatus,
  type OilAttachment,
  type OilProduct,
  type OilPurchase,
  type OilSale,
  type OilUnit,
  type PaymentStatus,
} from '@/lib/oilTrade';
import {
  EmptyState,
  ErrorBanner,
  Field,
  FormError,
  LoadingRows,
  Modal,
  PaymentBadge,
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

type Kind = 'purchase' | 'sale';
type Row = OilPurchase | OilSale;

const isSale = (row: Row): row is OilSale => 'customer' in row;
const party = (row: Row) => (isSale(row) ? row.customer : row.supplier);
const total = (row: Row) => Number(isSale(row) ? row.total_amount : row.total_cost);
const outstanding = (row: Row) => total(row) - Number(row.amount_paid);
const fmtDate = (d: string) => format(new Date(`${d}T12:00:00`), 'd MMM yyyy');

export function TransactionsTab({
  kind,
  initialQuery = '',
  range,
  products,
  inventory,
  refreshKey,
  onChanged,
}: {
  kind: Kind;
  initialQuery?: string;
  range: DateRange;
  products: OilProduct[];
  inventory: InventoryStatus[];
  refreshKey: number;
  onChanged: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  // A "view" link from the overview opens this tab already filtered to one reference.
  useEffect(() => {
    setQuery(initialQuery);
    if (initialQuery) setShowVoided(true);
  }, [initialQuery]);
  const [productFilter, setProductFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all');
  const [showVoided, setShowVoided] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [paying, setPaying] = useState<Row | null>(null);
  const [voiding, setVoiding] = useState<Row | null>(null);

  const noun = kind === 'sale' ? 'sale' : 'purchase';
  const partyLabel = kind === 'sale' ? 'Customer' : 'Supplier';

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(kind === 'sale' ? await oilQueries.sales(range.from, range.to) : await oilQueries.purchases(range.from, range.to));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to load ${noun}s`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, range.from, range.to, refreshKey]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (!showVoided && r.status === 'voided') return false;
      if (productFilter !== 'all' && r.product_id !== productFilter) return false;
      if (paymentFilter !== 'all' && (r.status === 'voided' || r.payment_status !== paymentFilter)) return false;
      if (q && ![r.reference, party(r), r.external_ref ?? '', r.oil_products?.name ?? ''].some((v) => v.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, query, productFilter, paymentFilter, showVoided]);

  const active = visible.filter((r) => r.status === 'active');
  const sumTotal = active.reduce((s, r) => s + total(r), 0);
  const sumPaid = active.reduce((s, r) => s + Number(r.amount_paid), 0);
  const parties = useMemo(() => Array.from(new Set(rows.map(party))).sort(), [rows]);

  const afterChange = () => onChanged();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${noun}s…`}
              className={`${inputClass} w-56 pl-9`}
              aria-label={`Search ${noun}s`}
            />
          </div>
          <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className={`${inputClass} w-auto`} aria-label="Product">
            <option value="all">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as 'all' | PaymentStatus)} className={`${inputClass} w-auto`} aria-label="Payment status">
            <option value="all">Any payment status</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Part paid</option>
            <option value="paid">Paid</option>
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
          disabled={!products.some((p) => p.is_active)}
        >
          <Plus className="h-4 w-4" /> Record {noun}
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => void load()} />}

      <div className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 text-xs text-gray-500 dark:border-white/5 dark:text-gray-400">
          <span>
            {active.length} active {noun}
            {active.length === 1 ? '' : 's'} · {describeRange(range)}
          </span>
          <span className="tabular-nums">
            Total {fmtMoney(sumTotal)} · Paid {fmtMoney(sumPaid)} · Outstanding {fmtMoney(sumTotal - sumPaid)}
          </span>
        </div>
        {loading ? (
          <LoadingRows />
        ) : visible.length === 0 ? (
          <EmptyState title={`No ${noun}s`} body={rows.length ? 'Nothing matches these filters.' : `No ${noun}s in ${describeRange(range).toLowerCase()}.`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-white/5 dark:bg-white/[0.02]">
                <tr>
                  <th className={th}>Reference</th>
                  <th className={th}>Date</th>
                  <th className={th}>Product</th>
                  <th className={th}>{partyLabel}</th>
                  <th className={thRight}>Quantity</th>
                  <th className={thRight}>Unit price</th>
                  <th className={thRight}>Total</th>
                  <th className={thRight}>Outstanding</th>
                  <th className={th}>Payment</th>
                  <th className={thRight}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {visible.map((r) => {
                  const voided = r.status === 'voided';
                  const files = !isSale(r) ? r.attachments : [];
                  return (
                    <tr key={r.id} className={voided ? 'opacity-50' : 'hover:bg-gray-50/60 dark:hover:bg-white/[0.02]'}>
                      <td className={td}>
                        <div className="font-medium text-gray-900 dark:text-white">{r.reference}</div>
                        {r.external_ref && <div className="text-xs text-gray-500">{r.external_ref}</div>}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{fmtDate(r.transaction_date)}</td>
                      <td className={td}>{r.oil_products?.code ?? '—'}</td>
                      <td className={`${td} max-w-[12rem] truncate`} title={party(r)}>
                        {party(r)}
                      </td>
                      <td className={tdRight}>{fmtQty(r.quantity, r.unit)}</td>
                      <td className={tdRight}>{fmtMoney(r.unit_price)}</td>
                      <td className={`${tdRight} font-medium text-gray-900 dark:text-white`}>{fmtMoney(total(r))}</td>
                      <td className={tdRight}>{fmtMoney(outstanding(r))}</td>
                      <td className={td}>{voided ? <VoidedBadge status={r.status} reason={r.void_reason} /> : <PaymentBadge status={r.payment_status} />}</td>
                      <td className={`${td} text-right`}>
                        <div className="inline-flex gap-0.5">
                          {files.length > 0 && <AttachmentMenu files={files} />}
                          {!voided && outstanding(r) > 0 && (
                            <button type="button" className={iconButton} title="Record payment" aria-label={`Record payment for ${r.reference}`} onClick={() => setPaying(r)}>
                              <Banknote className="h-4 w-4" />
                            </button>
                          )}
                          {!voided && (
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
                          )}
                          {!voided && (
                            <button type="button" className={iconButton} title="Void" aria-label={`Void ${r.reference}`} onClick={() => setVoiding(r)}>
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionForm
        kind={kind}
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        products={products}
        inventory={inventory}
        parties={parties}
        onSaved={() => {
          setFormOpen(false);
          afterChange();
        }}
      />
      <PaymentDialog
        record={paying}
        onOpenChange={(open) => !open && setPaying(null)}
        onSaved={() => {
          setPaying(null);
          afterChange();
        }}
      />
      <VoidDialog
        open={voiding !== null}
        onOpenChange={(open) => !open && setVoiding(null)}
        title={`Void ${voiding?.reference ?? ''}`}
        description={
          kind === 'sale'
            ? 'The quantity returns to stock and the sale leaves revenue and profit. Later sales are re-costed.'
            : 'The stock leaves inventory. This is refused if later sales depend on it.'
        }
        onConfirm={async (reason) => {
          if (!voiding) return;
          await oilApi.voidRecord(kind, voiding.id, reason);
          toast.success(`${voiding.reference} voided`);
          setVoiding(null);
          afterChange();
        }}
      />
    </div>
  );
}

function AttachmentMenu({ files }: { files: OilAttachment[] }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <button type="button" className={iconButton} title="Attachments" aria-label="Attachments" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Paperclip className="h-4 w-4" />
      </button>
      {open && (
        <ul className="absolute right-0 top-9 z-20 w-56 rounded-lg border border-gray-200 bg-white p-1 text-left shadow-lg dark:border-white/10 dark:bg-gray-900">
          {files.map((f) => (
            <li key={f.path}>
              <button
                type="button"
                className="block w-full truncate rounded-md px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                onClick={() => {
                  setOpen(false);
                  openAttachment(f.path).catch((err: Error) => toast.error(err.message));
                }}
              >
                {f.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

function TransactionForm({
  kind,
  open,
  onOpenChange,
  record,
  products,
  inventory,
  parties,
  onSaved,
}: {
  kind: Kind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Row | null;
  products: OilProduct[];
  inventory: InventoryStatus[];
  parties: string[];
  onSaved: () => void;
}) {
  const idempotencyKey = useIdempotencyKey(open);
  const fileInput = useRef<HTMLInputElement>(null);
  const [productId, setProductId] = useState('');
  const [unit, setUnit] = useState<OilUnit>('litre');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [date, setDate] = useState(todayIso());
  const [counterparty, setCounterparty] = useState('');
  const [externalRef, setExternalRef] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<OilAttachment[]>([]);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choosable = products.filter((p) => p.is_active || p.id === record?.product_id);
  const product = products.find((p) => p.id === productId);
  const units = unitsFor(product);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setUploaded([]);
    if (record) {
      setProductId(record.product_id);
      setUnit(record.unit);
      setQuantity(String(Number(record.quantity)));
      setUnitPrice(String(Number(record.unit_price)));
      setAmountPaid(String(Number(record.amount_paid)));
      setDate(record.transaction_date);
      setCounterparty(party(record));
      setExternalRef(record.external_ref ?? '');
      setNotes(record.notes ?? '');
      setAttachments(isSale(record) ? [] : record.attachments);
    } else {
      const first = products.find((p) => p.is_active);
      setProductId(first?.id ?? '');
      setUnit(first?.base_unit ?? 'litre');
      setQuantity('');
      setUnitPrice('');
      setAmountPaid('');
      setDate(todayIso());
      setCounterparty('');
      setExternalRef('');
      setNotes('');
      setAttachments([]);
    }
  }, [open, record, products]);

  // Keep the unit valid for the chosen product.
  useEffect(() => {
    if (product && !units.includes(unit)) setUnit(product.base_unit);
  }, [product, units, unit]);

  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  const lineTotal = Math.round(qty * price * 100) / 100;
  const paid = Number(amountPaid) || 0;

  // Stock available for this sale, in the chosen unit (server re-checks on save).
  const stockInfo = useMemo(() => {
    if (kind !== 'sale' || !product) return null;
    let base = Number(inventory.find((i) => i.product_id === product.id)?.on_hand_quantity ?? 0);
    if (record && record.product_id === product.id && record.status === 'active') base += Number(record.base_quantity);
    const inUnit = fromBase(product, base, unit);
    return { base, inUnit };
  }, [kind, product, inventory, record, unit]);
  const neededBase = product ? (unit === product.base_unit ? qty : qty * Number(product.oil_product_units.find((u) => u.unit === unit)?.factor_to_base ?? 0)) : 0;
  const shortOfStock = kind === 'sale' && stockInfo !== null && neededBase > stockInfo.base + 1e-6;

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (attachments.length + files.length > 10) {
      setError('Up to 10 attachments are allowed');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const a = await uploadPurchaseAttachment(record?.id ?? idempotencyKey, file);
        setAttachments((list) => [...list, a]);
        setUploaded((list) => [...list, a.path]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const close = (next: boolean) => {
    if (!next && uploaded.length > 0) {
      // Uploaded during this form but never saved: tidy up.
      void removeAttachments(uploaded);
    }
    onOpenChange(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (paid > lineTotal) {
      setError('Amount paid cannot be more than the total.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        id: record?.id ?? null,
        idempotency_key: record ? null : idempotencyKey,
        product_id: productId,
        quantity: qty,
        unit,
        unit_price: price,
        amount_paid: paid,
        transaction_date: date,
        external_ref: externalRef.trim() || null,
        notes: notes.trim() || null,
        ...(kind === 'sale' ? { customer: counterparty.trim() } : { supplier: counterparty.trim(), attachments }),
      };
      const result = kind === 'sale' ? await oilApi.saveSale(payload) : await oilApi.savePurchase(payload);
      if (record && kind === 'purchase') {
        const kept = new Set(attachments.map((a) => a.path));
        const removed = (record as OilPurchase).attachments.filter((a) => !kept.has(a.path)).map((a) => a.path);
        void removeAttachments(removed);
      }
      setUploaded([]);
      toast.success(result.duplicate ? `${result.reference} was already saved` : `${result.reference} ${record ? 'updated' : 'recorded'}`);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to save the ${kind}`);
    } finally {
      setBusy(false);
    }
  };

  const title = record ? `Edit ${record.reference}` : kind === 'sale' ? 'Record sale' : 'Record purchase';

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={title}
      description={kind === 'sale' ? 'Stock is checked on the sale date before saving.' : 'Stock increases as soon as the purchase is saved.'}
      wide
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={() => close(false)}>
            Cancel
          </button>
          <SubmitButton busy={busy} form="txn-form">
            {record ? 'Save changes' : kind === 'sale' ? 'Record sale' : 'Record purchase'}
          </SubmitButton>
        </>
      }
    >
      <form id="txn-form" onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product" required>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} required className={inputClass}>
              {choosable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.is_active ? '' : ' (inactive)'}
                </option>
              ))}
            </select>
          </Field>
          <Field label={kind === 'sale' ? 'Customer' : 'Supplier'} required>
            <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} required maxLength={200} list={`${kind}-parties`} className={inputClass} />
            <datalist id={`${kind}-parties`}>
              {parties.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label={kind === 'sale' ? 'Quantity sold' : 'Quantity'}
            required
            hint={
              stockInfo ? (
                <span className={shortOfStock ? 'font-medium text-rose-600 dark:text-rose-400' : ''}>
                  {stockInfo.inUnit === null ? `${fmtQty(stockInfo.base, product?.base_unit)} in stock` : `${fmtQty(stockInfo.inUnit, unit)} in stock today`}
                  {shortOfStock ? ': not enough' : ''}
                </span>
              ) : undefined
            }
          >
            <input type="number" inputMode="decimal" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className={inputClass} />
          </Field>
          <Field label="Unit" required hint={units.length === 1 && product ? 'Add other units under Products' : undefined}>
            <select value={unit} onChange={(e) => setUnit(e.target.value as OilUnit)} className={inputClass}>
              {units.map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABEL[u].name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={kind === 'sale' ? 'Unit selling price (₦)' : 'Unit purchase price (₦)'} required>
            <input type="number" inputMode="decimal" min="0" step="any" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required className={inputClass} />
          </Field>
        </div>

        <div className="grid gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-3 dark:bg-white/[0.03]">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{kind === 'sale' ? 'Total selling amount' : 'Total purchase cost'}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{fmtMoney(lineTotal)}</p>
          </div>
          <Field label="Amount paid (₦)">
            <div className="flex gap-2">
              <input type="number" inputMode="decimal" min="0" step="any" max={lineTotal || undefined} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className={inputClass} />
              <button type="button" className={`${secondaryButton} px-3 text-xs`} onClick={() => setAmountPaid(String(lineTotal))}>
                Full
              </button>
            </div>
          </Field>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding balance</p>
            <p className={`mt-1 text-lg font-semibold tabular-nums ${lineTotal - paid > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
              {fmtMoney(Math.max(lineTotal - paid, 0))}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Transaction date" required>
            <input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
          </Field>
          <Field label={kind === 'sale' ? 'Invoice / waybill number' : 'Supplier invoice / reference'} hint={`A ${kind === 'sale' ? 'OS' : 'OP'}- reference is created automatically.`}>
            <input value={externalRef} onChange={(e) => setExternalRef(e.target.value)} maxLength={100} className={inputClass} />
          </Field>
        </div>

        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={2000} className={inputClass} />
        </Field>

        {kind === 'purchase' && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Attachments</span>
              <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400" onClick={() => fileInput.current?.click()} disabled={uploading || attachments.length >= 10}>
                <Upload className="h-3.5 w-3.5" /> {uploading ? 'Uploading…' : 'Add files'}
              </button>
              <input ref={fileInput} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={(e) => void onFiles(e.target.files)} />
            </div>
            {attachments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 px-3 py-3 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
                Invoices, waybills or receipts. PDF or images, up to 10 MB each. Stored privately.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-white/5 dark:border-white/10">
                {attachments.map((a) => (
                  <li key={a.path} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <Paperclip className="h-4 w-4 shrink-0 text-gray-400" />
                    <button type="button" className="min-w-0 flex-1 truncate text-left text-gray-700 hover:underline dark:text-gray-300" onClick={() => openAttachment(a.path).catch((err: Error) => toast.error(err.message))}>
                      {a.name}
                    </button>
                    <span className="text-xs text-gray-400">{Math.max(1, Math.round(a.size / 1024))} KB</span>
                    <button type="button" className={iconButton} aria-label={`Remove ${a.name}`} onClick={() => setAttachments((list) => list.filter((x) => x.path !== a.path))}>
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

function PaymentDialog({ record, onOpenChange, onSaved }: { record: Row | null; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const due = record ? outstanding(record) : 0;

  useEffect(() => {
    if (record) {
      setAmount('');
      setError(null);
    }
  }, [record]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    setBusy(true);
    setError(null);
    try {
      const result = await oilApi.recordPayment(isSale(record) ? 'sale' : 'purchase', record.id, Number(amount));
      toast.success(Number(result.outstanding) === 0 ? `${record.reference} is fully paid` : `Payment recorded. ${fmtMoney(result.outstanding)} outstanding.`);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record the payment');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={record !== null}
      onOpenChange={onOpenChange}
      title={`Record payment · ${record?.reference ?? ''}`}
      description={record ? `${party(record)} · ${fmtMoney(due)} outstanding of ${fmtMoney(total(record))}` : undefined}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <SubmitButton busy={busy} form="payment-form">
            Record payment
          </SubmitButton>
        </>
      }
    >
      <form id="payment-form" onSubmit={submit}>
        <FormError message={error} />
        <Field label={record && isSale(record) ? 'Amount received (₦)' : 'Amount paid (₦)'} required>
          <div className="flex gap-2">
            <input type="number" inputMode="decimal" min="0.01" step="any" max={due} value={amount} onChange={(e) => setAmount(e.target.value)} required className={inputClass} autoFocus />
            <button type="button" className={`${secondaryButton} px-3 text-xs`} onClick={() => setAmount(String(due))}>
              Full balance
            </button>
          </div>
        </Field>
      </form>
    </Modal>
  );
}
