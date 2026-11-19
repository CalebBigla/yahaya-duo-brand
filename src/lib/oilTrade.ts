/**
 * Oil trade module: types, labels and the calls into the database functions.
 *
 * Every write goes through a SECURITY DEFINER function (see
 * supabase/migrations/*_oil_trade_module.sql) that checks the caller is an owner,
 * validates the record and rebuilds the stock ledger atomically. All money and
 * stock figures shown in the app come from those functions or the derived ledger;
 * the browser never calculates profit or inventory itself.
 */
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

export const OIL_UNITS = ['litre', 'barrel', 'metric_tonne', 'kilogram', 'cubic_metre', 'us_gallon'] as const;
export type OilUnit = (typeof OIL_UNITS)[number];

export const UNIT_LABEL: Record<OilUnit, { name: string; plural: string; short: string }> = {
  litre: { name: 'Litre', plural: 'Litres', short: 'L' },
  barrel: { name: 'Barrel', plural: 'Barrels', short: 'bbl' },
  metric_tonne: { name: 'Metric tonne', plural: 'Metric tonnes', short: 'MT' },
  kilogram: { name: 'Kilogram', plural: 'Kilograms', short: 'kg' },
  cubic_metre: { name: 'Cubic metre', plural: 'Cubic metres', short: 'm³' },
  us_gallon: { name: 'US gallon', plural: 'US gallons', short: 'US gal' },
};

export function unitShort(unit: string): string {
  return UNIT_LABEL[unit as OilUnit]?.short ?? unit;
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export interface OilProductUnit {
  product_id: string;
  unit: OilUnit;
  factor_to_base: number;
}

export interface OilProduct {
  id: string;
  name: string;
  code: string;
  base_unit: OilUnit;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  oil_product_units: OilProductUnit[];
}

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type RecordStatus = 'active' | 'voided';

export interface OilAttachment {
  path: string;
  name: string;
  size: number;
  type: string;
}

interface ProductRef {
  name: string;
  code: string;
  base_unit: OilUnit;
}

export interface OilPurchase {
  id: string;
  reference: string;
  product_id: string;
  supplier: string;
  quantity: number;
  unit: OilUnit;
  base_quantity: number;
  unit_price: number;
  total_cost: number;
  amount_paid: number;
  payment_status: PaymentStatus;
  transaction_date: string;
  external_ref: string | null;
  notes: string | null;
  attachments: OilAttachment[];
  status: RecordStatus;
  void_reason: string | null;
  created_at: string;
  oil_products: ProductRef | null;
}

export interface OilSale {
  id: string;
  reference: string;
  product_id: string;
  customer: string;
  quantity: number;
  unit: OilUnit;
  base_quantity: number;
  unit_price: number;
  total_amount: number;
  amount_paid: number;
  outstanding: number;
  payment_status: PaymentStatus;
  transaction_date: string;
  external_ref: string | null;
  notes: string | null;
  status: RecordStatus;
  void_reason: string | null;
  created_at: string;
  oil_products: ProductRef | null;
}

export const EXPENSE_CATEGORIES = [
  { value: 'transportation', label: 'Transportation' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'storage', label: 'Storage' },
  { value: 'loading_offloading', label: 'Loading and offloading' },
  { value: 'handling', label: 'Handling charges' },
  { value: 'taxes_levies', label: 'Taxes and levies' },
  { value: 'other', label: 'Other expenses' },
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value'];

export function categoryLabel(value: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export interface OilExpense {
  id: string;
  reference: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  payee: string | null;
  product_id: string | null;
  purchase_id: string | null;
  sale_id: string | null;
  external_ref: string | null;
  notes: string | null;
  status: RecordStatus;
  void_reason: string | null;
  created_at: string;
  oil_products: Pick<ProductRef, 'name' | 'code'> | null;
  oil_purchases: { reference: string } | null;
  oil_sales: { reference: string } | null;
}

export interface OilAdjustment {
  id: string;
  reference: string;
  product_id: string;
  quantity: number;
  unit: OilUnit;
  base_quantity: number;
  adjustment_date: string;
  reason: string;
  status: RecordStatus;
  void_reason: string | null;
  created_at: string;
  oil_products: ProductRef | null;
}

export interface LedgerRow {
  product_id: string;
  position: number;
  movement_type: 'purchase' | 'sale' | 'adjustment';
  source_id: string;
  reference: string;
  movement_date: string;
  quantity_change: number;
  unit_cost: number;
  value_change: number;
  balance_quantity: number;
  balance_value: number;
  average_cost: number;
}

export interface InventoryStatus {
  product_id: string;
  name: string;
  code: string;
  base_unit: OilUnit;
  is_active: boolean;
  on_hand_quantity: number;
  inventory_value: number;
  average_cost: number;
  last_movement_date: string | null;
}

export interface ProductSummary {
  product_id: string;
  name: string;
  code: string;
  base_unit: OilUnit;
  is_active: boolean;
  opening_quantity: number;
  opening_value: number;
  purchase_count: number;
  quantity_purchased: number;
  purchase_cost: number;
  payable: number;
  sale_count: number;
  quantity_sold: number;
  revenue: number;
  receivable: number;
  cogs: number;
  gross_profit: number;
  adjustment_quantity: number;
  adjustment_value: number;
  direct_expenses: number;
  net_profit: number;
  closing_quantity: number;
  closing_value: number;
  available_quantity: number;
  inventory_value: number;
  average_cost: number;
}

export interface OilTradeSummary {
  from: string | null;
  to: string;
  totals: {
    revenue: number;
    purchase_cost: number;
    cogs: number;
    gross_profit: number;
    operating_expenses: number;
    adjustments: number;
    net_profit: number;
    receivable: number;
    payable: number;
    inventory_value: number;
  };
  products: ProductSummary[];
  expenses_by_category: { category: ExpenseCategory; amount: number; count: number }[];
}

export interface SaveResult {
  id: string;
  reference: string;
  duplicate: boolean;
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(friendlyError(error.message));
  return data as T;
}

function friendlyError(message: string): string {
  if (/permission denied|Only owners/i.test(message)) return 'Only owners can manage oil trade records.';
  if (/Could not find the function|does not exist/i.test(message)) {
    return 'The oil trade database update has not been applied yet. Apply the oil trade migration, then try again.';
  }
  return message;
}

export const oilApi = {
  summary: (from: string | null, to: string | null) => rpc<OilTradeSummary>('oil_trade_summary', { p_from: from, p_to: to }),
  saveProduct: (payload: Record<string, unknown>) => rpc<{ id: string }>('oil_save_product', { p: payload }),
  setProductActive: (id: string, active: boolean) => rpc<void>('oil_set_product_active', { p_id: id, p_active: active }),
  savePurchase: (payload: Record<string, unknown>) => rpc<SaveResult>('oil_save_purchase', { p: payload }),
  saveSale: (payload: Record<string, unknown>) => rpc<SaveResult>('oil_save_sale', { p: payload }),
  saveExpense: (payload: Record<string, unknown>) => rpc<SaveResult>('oil_save_expense', { p: payload }),
  saveAdjustment: (payload: Record<string, unknown>) => rpc<SaveResult>('oil_save_adjustment', { p: payload }),
  recordPayment: (kind: 'sale' | 'purchase', id: string, amount: number) =>
    rpc<{ amount_paid: number; outstanding: number }>('oil_record_payment', { p_kind: kind, p_id: id, p_amount: amount }),
  voidRecord: (kind: 'purchase' | 'sale' | 'expense' | 'adjustment', id: string, reason: string) =>
    rpc<void>('oil_void_transaction', { p_kind: kind, p_id: id, p_reason: reason }),
};

async function select<T>(promise: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(friendlyError(error.message));
  return (data ?? []) as T;
}

export const oilQueries = {
  products: () =>
    select<OilProduct[]>(supabase.from('oil_products').select('*, oil_product_units(*)').order('name')),
  inventory: () =>
    select<InventoryStatus[]>(supabase.from('oil_inventory_status').select('*').order('name')),
  purchases: (from: string | null, to: string | null) => {
    let q = supabase.from('oil_purchases').select('*, oil_products(name, code, base_unit)');
    if (from) q = q.gte('transaction_date', from);
    if (to) q = q.lte('transaction_date', to);
    return select<OilPurchase[]>(q.order('transaction_date', { ascending: false }).order('created_at', { ascending: false }).limit(1000));
  },
  sales: (from: string | null, to: string | null) => {
    let q = supabase.from('oil_sales').select('*, oil_products(name, code, base_unit)');
    if (from) q = q.gte('transaction_date', from);
    if (to) q = q.lte('transaction_date', to);
    return select<OilSale[]>(q.order('transaction_date', { ascending: false }).order('created_at', { ascending: false }).limit(1000));
  },
  expenses: (from: string | null, to: string | null) => {
    let q = supabase
      .from('oil_expenses')
      .select('*, oil_products(name, code), oil_purchases(reference), oil_sales(reference)');
    if (from) q = q.gte('expense_date', from);
    if (to) q = q.lte('expense_date', to);
    return select<OilExpense[]>(q.order('expense_date', { ascending: false }).order('created_at', { ascending: false }).limit(1000));
  },
  adjustments: (from: string | null, to: string | null) => {
    let q = supabase.from('oil_stock_adjustments').select('*, oil_products(name, code, base_unit)');
    if (from) q = q.gte('adjustment_date', from);
    if (to) q = q.lte('adjustment_date', to);
    return select<OilAdjustment[]>(q.order('adjustment_date', { ascending: false }).limit(1000));
  },
  ledger: (productId: string, from: string | null, to: string | null) => {
    let q = supabase.from('oil_stock_ledger').select('*').eq('product_id', productId);
    if (from) q = q.gte('movement_date', from);
    if (to) q = q.lte('movement_date', to);
    return select<LedgerRow[]>(q.order('position', { ascending: true }));
  },
  /** Recent active purchases and sales, for linking an expense to a transaction. */
  linkable: async () => {
    const [purchases, sales] = await Promise.all([
      select<{ id: string; reference: string; transaction_date: string; supplier: string; oil_products: { code: string } | null }[]>(
        supabase.from('oil_purchases').select('id, reference, transaction_date, supplier, oil_products(code)').eq('status', 'active').order('transaction_date', { ascending: false }).limit(200),
      ),
      select<{ id: string; reference: string; transaction_date: string; customer: string; oil_products: { code: string } | null }[]>(
        supabase.from('oil_sales').select('id, reference, transaction_date, customer, oil_products(code)').eq('status', 'active').order('transaction_date', { ascending: false }).limit(200),
      ),
    ]);
    return { purchases, sales };
  },
};

// ---------------------------------------------------------------------------
// Attachments (private bucket; owners only)
// ---------------------------------------------------------------------------

export const ATTACHMENT_BUCKET = 'oil-trade-attachments';
export const ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export async function uploadPurchaseAttachment(folder: string, file: File): Promise<OilAttachment> {
  if (!ATTACHMENT_TYPES.includes(file.type)) throw new Error(`${file.name}: only PDF and image files are allowed`);
  if (file.size > ATTACHMENT_MAX_BYTES) throw new Error(`${file.name}: files must be 10 MB or smaller`);
  const safeName = file.name.replace(/[^\w.-]+/g, '_').slice(-80);
  const path = `purchases/${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(ATTACHMENT_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`${file.name}: ${error.message}`);
  return { path, name: file.name, size: file.size, type: file.type };
}

export async function openAttachment(path: string) {
  const { data, error } = await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrl(path, 60);
  if (error || !data) throw new Error(error?.message ?? 'Unable to open the file');
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}

export async function removeAttachments(paths: string[]) {
  if (paths.length === 0) return;
  await supabase.storage.from(ATTACHMENT_BUCKET).remove(paths);
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const money = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2, minimumFractionDigits: 0 });
const moneyCompact = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 });
const qtyFormat = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 3 });

export const fmtMoney = (n: number | string | null | undefined) => money.format(Number(n ?? 0));
export const fmtMoneyCompact = (n: number | string | null | undefined) => moneyCompact.format(Number(n ?? 0));
export const fmtQty = (n: number | string | null | undefined, unit?: string) =>
  `${qtyFormat.format(Number(n ?? 0))}${unit ? ` ${unitShort(unit)}` : ''}`;

/** Converts base-unit quantities into `unit` using the product's configured factor. */
export function fromBase(product: OilProduct | undefined, baseQuantity: number, unit: string): number | null {
  if (!product) return null;
  if (unit === product.base_unit) return baseQuantity;
  const factor = product.oil_product_units.find((u) => u.unit === unit)?.factor_to_base;
  return factor ? baseQuantity / Number(factor) : null;
}

/** Units a product can be traded in: its base unit plus configured conversions. */
export function unitsFor(product: OilProduct | undefined): OilUnit[] {
  if (!product) return [];
  return [product.base_unit, ...product.oil_product_units.map((u) => u.unit).filter((u) => u !== product.base_unit)];
}
