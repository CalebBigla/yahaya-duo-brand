import { useEffect, useState } from 'react';
import { Ban, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  fmtMoney,
  fmtQty,
  fromBase,
  oilApi,
  oilQueries,
  unitsFor,
  UNIT_LABEL,
  type InventoryStatus,
  type LedgerRow,
  type OilAdjustment,
  type OilProduct,
  type OilUnit,
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
const MOVEMENT_LABEL: Record<LedgerRow['movement_type'], string> = { purchase: 'Purchase', sale: 'Sale', adjustment: 'Adjustment' };

export function InventoryTab({
  range,
  products,
  inventory,
  refreshKey,
  onChanged,
}: {
  range: DateRange;
  products: OilProduct[];
  inventory: InventoryStatus[];
  refreshKey: number;
  onChanged: () => void;
}) {
  const [ledgerProduct, setLedgerProduct] = useState(products[0]?.id ?? '');
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [adjustments, setAdjustments] = useState<OilAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [voiding, setVoiding] = useState<OilAdjustment | null>(null);

  useEffect(() => {
    if (!ledgerProduct && products[0]) setLedgerProduct(products[0].id);
  }, [products, ledgerProduct]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [l, a] = await Promise.all([
        ledgerProduct ? oilQueries.ledger(ledgerProduct, range.from, range.to) : Promise.resolve([]),
        oilQueries.adjustments(range.from, range.to),
      ]);
      setLedger(l);
      setAdjustments(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerProduct, range.from, range.to, refreshKey]);

  const product = products.find((p) => p.id === ledgerProduct);
  const totalValue = inventory.reduce((s, i) => s + Number(i.inventory_value), 0);

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-labelledby="stock-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="stock-heading" className="text-sm font-semibold text-gray-900 dark:text-white">
              Stock on hand
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Valued at moving weighted-average cost · total {fmtMoney(totalValue)}</p>
          </div>
          <button type="button" className={primaryButton} onClick={() => setAdjusting(true)} disabled={!products.some((p) => p.is_active)}>
            <SlidersHorizontal className="h-4 w-4" /> Adjust stock
          </button>
        </div>
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-white/5 dark:bg-white/[0.02]">
              <tr>
                <th className={th}>Product</th>
                <th className={thRight}>On hand</th>
                <th className={thRight}>Other units</th>
                <th className={thRight}>Average cost</th>
                <th className={thRight}>Stock value</th>
                <th className={th}>Last movement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {inventory.map((i) => {
                const p = products.find((x) => x.id === i.product_id);
                return (
                  <tr key={i.product_id} className={i.is_active ? '' : 'opacity-60'}>
                    <td className={td}>
                      <span className="font-medium text-gray-900 dark:text-white">{i.name}</span>
                      <span className="ml-2 text-xs text-gray-500">{i.code}</span>
                    </td>
                    <td className={`${tdRight} font-medium text-gray-900 dark:text-white`}>{fmtQty(i.on_hand_quantity, i.base_unit)}</td>
                    <td className={`${tdRight} text-xs text-gray-500`}>
                      {(p?.oil_product_units ?? [])
                        .map((u) => fmtQty(fromBase(p, Number(i.on_hand_quantity), u.unit) ?? 0, u.unit))
                        .join(' · ') || '—'}
                    </td>
                    <td className={tdRight}>
                      {fmtMoney(i.average_cost)} / {UNIT_LABEL[i.base_unit].short}
                    </td>
                    <td className={tdRight}>{fmtMoney(i.inventory_value)}</td>
                    <td className={`${td} whitespace-nowrap`}>{i.last_movement_date ? fmtDate(i.last_movement_date) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {error && <ErrorBanner message={error} onRetry={() => void load()} />}

      <section className="space-y-3" aria-labelledby="ledger-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="ledger-heading" className="text-sm font-semibold text-gray-900 dark:text-white">
              Stock movements
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Every purchase, sale and adjustment in date order, with the running balance · {describeRange(range)}
            </p>
          </div>
          <select value={ledgerProduct} onChange={(e) => setLedgerProduct(e.target.value)} className={`${inputClass} w-auto`} aria-label="Product">
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className={`${card} overflow-hidden`}>
          {loading ? (
            <LoadingRows />
          ) : ledger.length === 0 ? (
            <EmptyState title="No movements" body={`No stock movements for ${product?.name ?? 'this product'} in this period.`} />
          ) : (
            <div className="max-h-[32rem] overflow-auto">
              <table className="w-full min-w-[860px]">
                <thead className="sticky top-0 border-b border-gray-100 bg-gray-50 dark:border-white/5 dark:bg-gray-900">
                  <tr>
                    <th className={th}>Date</th>
                    <th className={th}>Movement</th>
                    <th className={th}>Reference</th>
                    <th className={thRight}>Quantity</th>
                    <th className={thRight}>Unit cost</th>
                    <th className={thRight}>Value</th>
                    <th className={thRight}>Balance</th>
                    <th className={thRight}>Balance value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {ledger.map((l) => {
                    const q = Number(l.quantity_change);
                    return (
                      <tr key={l.position}>
                        <td className={`${td} whitespace-nowrap`}>{fmtDate(l.movement_date)}</td>
                        <td className={td}>{MOVEMENT_LABEL[l.movement_type]}</td>
                        <td className={td}>{l.reference}</td>
                        <td className={`${tdRight} ${q < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          {q > 0 ? '+' : ''}
                          {fmtQty(q, product?.base_unit)}
                        </td>
                        <td className={tdRight}>{fmtMoney(l.unit_cost)}</td>
                        <td className={tdRight}>{fmtMoney(l.value_change)}</td>
                        <td className={`${tdRight} font-medium text-gray-900 dark:text-white`}>{fmtQty(l.balance_quantity, product?.base_unit)}</td>
                        <td className={tdRight}>{fmtMoney(l.balance_value)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="adjustments-heading">
        <h2 id="adjustments-heading" className="text-sm font-semibold text-gray-900 dark:text-white">
          Stock adjustments
        </h2>
        <div className={`${card} overflow-hidden`}>
          {adjustments.length === 0 ? (
            <EmptyState title="No adjustments" body="Use Adjust stock for losses, gains or count corrections." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-white/5 dark:bg-white/[0.02]">
                  <tr>
                    <th className={th}>Reference</th>
                    <th className={th}>Date</th>
                    <th className={th}>Product</th>
                    <th className={thRight}>Quantity</th>
                    <th className={th}>Reason</th>
                    <th className={thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {adjustments.map((a) => (
                    <tr key={a.id} className={a.status === 'voided' ? 'opacity-50' : ''}>
                      <td className={td}>
                        <div className="font-medium text-gray-900 dark:text-white">{a.reference}</div>
                        <VoidedBadge status={a.status} reason={a.void_reason} />
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{fmtDate(a.adjustment_date)}</td>
                      <td className={td}>{a.oil_products?.code}</td>
                      <td className={tdRight}>
                        {Number(a.quantity) > 0 ? '+' : ''}
                        {fmtQty(a.quantity, a.unit)}
                      </td>
                      <td className={`${td} max-w-[20rem] truncate`} title={a.reason}>
                        {a.reason}
                      </td>
                      <td className={`${td} text-right`}>
                        {a.status === 'active' && (
                          <button type="button" className={iconButton} title="Void" aria-label={`Void ${a.reference}`} onClick={() => setVoiding(a)}>
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <AdjustmentForm
        open={adjusting}
        onOpenChange={setAdjusting}
        products={products}
        inventory={inventory}
        onSaved={() => {
          setAdjusting(false);
          onChanged();
        }}
      />
      <VoidDialog
        open={voiding !== null}
        onOpenChange={(open) => !open && setVoiding(null)}
        title={`Void ${voiding?.reference ?? ''}`}
        description="The adjustment is reversed and later sales are re-costed. Refused if it would leave a later sale short of stock."
        onConfirm={async (reason) => {
          if (!voiding) return;
          await oilApi.voidRecord('adjustment', voiding.id, reason);
          toast.success(`${voiding.reference} voided`);
          setVoiding(null);
          onChanged();
        }}
      />
    </div>
  );
}

function AdjustmentForm({
  open,
  onOpenChange,
  products,
  inventory,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: OilProduct[];
  inventory: InventoryStatus[];
  onSaved: () => void;
}) {
  const idempotencyKey = useIdempotencyKey(open);
  const [productId, setProductId] = useState('');
  const [direction, setDirection] = useState<'decrease' | 'increase'>('decrease');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<OilUnit>('litre');
  const [unitCost, setUnitCost] = useState('');
  const [date, setDate] = useState(todayIso());
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = products.filter((p) => p.is_active);
  const product = products.find((p) => p.id === productId);
  const units = unitsFor(product);
  const stock = inventory.find((i) => i.product_id === productId);

  useEffect(() => {
    if (!open) return;
    const first = active[0];
    setProductId(first?.id ?? '');
    setUnit(first?.base_unit ?? 'litre');
    setDirection('decrease');
    setQuantity('');
    setUnitCost('');
    setDate(todayIso());
    setReason('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (product && !units.includes(unit)) setUnit(product.base_unit);
  }, [product, units, unit]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await oilApi.saveAdjustment({
        idempotency_key: idempotencyKey,
        product_id: productId,
        direction,
        quantity: Number(quantity),
        unit,
        unit_cost: direction === 'increase' && unitCost !== '' ? Number(unitCost) : null,
        adjustment_date: date,
        reason: reason.trim(),
      });
      toast.success(`${result.reference} recorded`);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save the adjustment');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Adjust stock"
      description="For losses, gains and stock-count corrections. Decreases are valued at the current average cost and reduce net profit."
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <SubmitButton busy={busy} form="adjust-form">
            Save adjustment
          </SubmitButton>
        </>
      }
    >
      <form id="adjust-form" onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product" required hint={stock ? `${fmtQty(stock.on_hand_quantity, stock.base_unit)} on hand` : undefined}>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass} required>
              {active.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Direction" required>
            <div role="radiogroup" className="inline-flex w-full rounded-lg border border-gray-300 p-0.5 dark:border-white/10">
              {(['decrease', 'increase'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={direction === d}
                  onClick={() => setDirection(d)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                    direction === d ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {d === 'decrease' ? 'Decrease (loss)' : 'Increase (gain)'}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Quantity" required>
            <input type="number" inputMode="decimal" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className={inputClass} />
          </Field>
          <Field label="Unit" required>
            <select value={unit} onChange={(e) => setUnit(e.target.value as OilUnit)} className={inputClass}>
              {units.map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABEL[u].name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date" required>
            <input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
          </Field>
        </div>
        {direction === 'increase' && (
          <Field label={`Unit cost per ${UNIT_LABEL[unit].name.toLowerCase()} (₦)`} hint="Leave blank to value the gain at the current average cost.">
            <input type="number" inputMode="decimal" min="0" step="any" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className={inputClass} />
          </Field>
        )}
        <Field label="Reason" required hint="e.g. Evaporation loss, tank dip correction">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} required minLength={3} maxLength={500} className={inputClass} />
        </Field>
      </form>
    </Modal>
  );
}
