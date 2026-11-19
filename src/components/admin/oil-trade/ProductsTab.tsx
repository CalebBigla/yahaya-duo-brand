import { useEffect, useState } from 'react';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { OIL_UNITS, UNIT_LABEL, oilApi, unitShort, type OilProduct, type OilUnit } from '@/lib/oilTrade';
import {
  EmptyState,
  Field,
  FormError,
  Modal,
  SubmitButton,
  card,
  iconButton,
  inputClass,
  primaryButton,
  secondaryButton,
  td,
  th,
} from './shared';

export function ProductsTab({ products, onChanged }: { products: OilProduct[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<OilProduct | null>(null);
  const [creating, setCreating] = useState(false);

  const toggleActive = async (product: OilProduct) => {
    try {
      await oilApi.setProductActive(product.id, !product.is_active);
      toast.success(`${product.name} ${product.is_active ? 'deactivated' : 'activated'}`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to update the product');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Each product keeps its own stock in its base unit. To trade it in another unit, add a conversion for that product,
          for example 1 barrel = 158.987 litres. Factors are never assumed, because they depend on the product's density.
        </p>
        <button type="button" className={primaryButton} onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      <div className={`${card} overflow-hidden`}>
        {products.length === 0 ? (
          <EmptyState title="No products yet" body="Add the products you buy and sell." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-white/5 dark:bg-white/[0.02]">
                <tr>
                  <th className={th}>Product</th>
                  <th className={th}>Base unit</th>
                  <th className={th}>Other units</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {products.map((p) => (
                  <tr key={p.id} className={p.is_active ? '' : 'opacity-60'}>
                    <td className={td}>
                      <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {p.code}
                        {p.description ? ` · ${p.description}` : ''}
                      </div>
                    </td>
                    <td className={td}>{UNIT_LABEL[p.base_unit].name}</td>
                    <td className={td}>
                      {p.oil_product_units.length === 0 ? (
                        <span className="text-gray-400">None</span>
                      ) : (
                        <ul className="space-y-0.5 text-xs">
                          {p.oil_product_units.map((u) => (
                            <li key={u.unit}>
                              1 {unitShort(u.unit)} = {Number(u.factor_to_base).toLocaleString('en-NG', { maximumFractionDigits: 6 })} {unitShort(p.base_unit)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className={td}>
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          p.is_active
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-white/5 dark:text-gray-400'
                        }`}
                      >
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="inline-flex gap-1">
                        <button type="button" className={iconButton} onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={iconButton}
                          onClick={() => void toggleActive(p)}
                          aria-label={p.is_active ? `Deactivate ${p.name}` : `Activate ${p.name}`}
                          title={p.is_active ? 'Deactivate (no new transactions)' : 'Activate'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductForm
        open={creating || editing !== null}
        product={editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          onChanged();
        }}
      />
    </div>
  );
}

interface ConversionDraft {
  unit: OilUnit;
  factor: string;
}

function ProductForm({
  open,
  product,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  product: OilProduct | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [baseUnit, setBaseUnit] = useState<OilUnit>('litre');
  const [description, setDescription] = useState('');
  const [conversions, setConversions] = useState<ConversionDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(product?.name ?? '');
    setCode(product?.code ?? '');
    setBaseUnit(product?.base_unit ?? 'litre');
    setDescription(product?.description ?? '');
    setConversions(product?.oil_product_units.map((u) => ({ unit: u.unit, factor: String(Number(u.factor_to_base)) })) ?? []);
  }, [open, product]);

  const unused = OIL_UNITS.filter((u) => u !== baseUnit && !conversions.some((c) => c.unit === u));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    for (const c of conversions) {
      const factor = Number(c.factor);
      if (!Number.isFinite(factor) || factor <= 0) {
        setError(`Enter how many ${UNIT_LABEL[baseUnit].plural.toLowerCase()} are in one ${UNIT_LABEL[c.unit].name.toLowerCase()}.`);
        return;
      }
    }
    setBusy(true);
    try {
      await oilApi.saveProduct({
        id: product?.id ?? null,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        base_unit: baseUnit,
        description: description.trim() || null,
        conversions: conversions.filter((c) => c.unit !== baseUnit).map((c) => ({ unit: c.unit, factor_to_base: Number(c.factor) })),
      });
      toast.success(product ? 'Product updated' : 'Product added');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save the product');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={product ? `Edit ${product.name}` : 'Add product'}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <SubmitButton busy={busy} form="product-form">
            {product ? 'Save changes' : 'Add product'}
          </SubmitButton>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name" required className="sm:col-span-2">
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className={inputClass} />
          </Field>
          <Field label="Code" required hint="e.g. AGO">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              maxLength={12}
              pattern="[A-Za-z0-9-]{1,12}"
              className={`${inputClass} uppercase`}
            />
          </Field>
        </div>
        <Field label="Base unit" required hint={product ? 'Stock is kept in this unit. It cannot change once the product has transactions.' : 'Stock is kept in this unit.'}>
          <select value={baseUnit} onChange={(e) => setBaseUnit(e.target.value as OilUnit)} className={inputClass}>
            {OIL_UNITS.map((u) => (
              <option key={u} value={u}>
                {UNIT_LABEL[u].name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} className={inputClass} />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Other units</span>
            {unused.length > 0 && (
              <button
                type="button"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                onClick={() => setConversions((c) => [...c, { unit: unused[0] as OilUnit, factor: '' }])}
              >
                + Add unit
              </button>
            )}
          </div>
          {conversions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 px-3 py-3 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
              Only {UNIT_LABEL[baseUnit].plural.toLowerCase()} can be used for this product.
            </p>
          ) : (
            <ul className="space-y-2">
              {conversions.map((c, index) => (
                <li key={index} className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span>1</span>
                  <select
                    value={c.unit}
                    onChange={(e) =>
                      setConversions((all) => all.map((x, i) => (i === index ? { ...x, unit: e.target.value as OilUnit } : x)))
                    }
                    className={`${inputClass} w-40`}
                    aria-label="Unit"
                  >
                    {[c.unit, ...unused].map((u) => (
                      <option key={u} value={u}>
                        {UNIT_LABEL[u].name}
                      </option>
                    ))}
                  </select>
                  <span>=</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={c.factor}
                    onChange={(e) => setConversions((all) => all.map((x, i) => (i === index ? { ...x, factor: e.target.value } : x)))}
                    className={`${inputClass} w-36`}
                    aria-label={`${UNIT_LABEL[baseUnit].plural} per ${UNIT_LABEL[c.unit].name}`}
                    required
                  />
                  <span>{UNIT_LABEL[baseUnit].plural.toLowerCase()}</span>
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => setConversions((all) => all.filter((_, i) => i !== index))}
                    aria-label="Remove unit"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Changing a factor only affects new transactions. Past records keep the quantity they were posted with.
          </p>
        </div>
      </form>
    </Modal>
  );
}
