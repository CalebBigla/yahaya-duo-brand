/**
 * Oil Trade specifics: date range filter, payment/void badges, void dialog and
 * idempotency keys. Generic UI comes from the shared admin kit.
 */
import { useEffect, useState } from 'react';
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { Loader2 } from 'lucide-react';
import type { PaymentStatus, RecordStatus } from '@/lib/oilTrade';

// Common pieces live in the shared admin kit; re-exported so tabs keep one import.
export {
  card,
  inputClass,
  primaryButton,
  secondaryButton,
  iconButton,
  th,
  thRight,
  td,
  tdRight,
  Modal,
  Field,
  FormError,
  SubmitButton,
  EmptyState,
  LoadingRows,
  ErrorBanner,
} from '@/components/admin/ui';
import { Modal, Field, FormError, inputClass, secondaryButton, btn, segmentClass } from '@/components/admin/ui';

// ---------------------------------------------------------------------------
// Date range
// ---------------------------------------------------------------------------

export type RangePreset = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

export interface DateRange {
  preset: RangePreset;
  from: string | null;
  to: string | null;
}

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom' },
];

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

export function rangeFor(preset: RangePreset, current?: DateRange): DateRange {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { preset, from: iso(now), to: iso(now) };
    case 'week':
      return { preset, from: iso(startOfWeek(now, { weekStartsOn: 1 })), to: iso(endOfWeek(now, { weekStartsOn: 1 })) };
    case 'month':
      return { preset, from: iso(startOfMonth(now)), to: iso(endOfMonth(now)) };
    case 'year':
      return { preset, from: iso(startOfYear(now)), to: iso(endOfYear(now)) };
    case 'all':
      return { preset, from: null, to: null };
    case 'custom':
      return { preset, from: current?.from ?? iso(startOfMonth(now)), to: current?.to ?? iso(now) };
  }
}

export function describeRange(range: DateRange): string {
  if (!range.from && !range.to) return 'All time';
  const f = (s: string) => format(new Date(`${s}T12:00:00`), 'd MMM yyyy');
  if (range.from && range.to && range.from === range.to) return f(range.from);
  return `${range.from ? f(range.from) : 'Start'} – ${range.to ? f(range.to) : 'today'}`;
}

/** The summary function treats "to" as inclusive and caps it at today. */
export function summaryArgs(range: DateRange): [string | null, string | null] {
  const today = iso(new Date());
  const to = range.to && range.to > today ? today : range.to;
  return [range.from, to];
}

export function DateRangeFilter({ value, onChange }: { value: DateRange; onChange: (range: DateRange) => void }) {
  const [draftFrom, setDraftFrom] = useState(value.from ?? '');
  const [draftTo, setDraftTo] = useState(value.to ?? '');
  useEffect(() => {
    setDraftFrom(value.from ?? '');
    setDraftTo(value.to ?? '');
  }, [value.from, value.to]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label="Date range" className="inline-flex flex-wrap items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-white/5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={value.preset === p.value}
            onClick={() => onChange(rangeFor(p.value, value))}
            className={segmentClass(value.preset === p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {value.preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="From"
            value={draftFrom}
            max={draftTo || undefined}
            onChange={(e) => setDraftFrom(e.target.value)}
            onBlur={() => draftFrom && onChange({ preset: 'custom', from: draftFrom, to: draftTo || null })}
            className={`${inputClass} w-auto py-1.5`}
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            aria-label="To"
            value={draftTo}
            min={draftFrom || undefined}
            onChange={(e) => setDraftTo(e.target.value)}
            onBlur={() => draftTo && onChange({ preset: 'custom', from: draftFrom || null, to: draftTo })}
            className={`${inputClass} w-auto py-1.5`}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

const PAYMENT_TONE: Record<PaymentStatus, string> = {
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  partial: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  unpaid: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${PAYMENT_TONE[status]}`}>
      {status === 'paid' ? 'Paid' : status === 'partial' ? 'Part paid' : 'Unpaid'}
    </span>
  );
}

export function VoidedBadge({ status, reason }: { status: RecordStatus; reason?: string | null }) {
  if (status !== 'voided') return null;
  return (
    <span
      title={reason ? `Voided: ${reason}` : 'Voided'}
      className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20 dark:bg-white/5 dark:text-gray-400"
    >
      Voided
    </span>
  );
}

// ---------------------------------------------------------------------------
// Void dialog
// ---------------------------------------------------------------------------

export function VoidDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to void this record');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="submit"
            form="void-form"
            disabled={busy || reason.trim().length < 3}
            className={btn('danger')}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Void record
          </button>
        </>
      }
    >
      <form id="void-form" onSubmit={submit}>
        <FormError message={error} />
        <Field label="Reason" required hint="Kept on the record and in the audit log.">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} className={inputClass} autoFocus />
        </Field>
      </form>
    </Modal>
  );
}

export function useIdempotencyKey(open: boolean) {
  // A new key each time a form opens; retries of the same submit reuse it.
  const [key, setKey] = useState(() => crypto.randomUUID());
  useEffect(() => {
    if (open) setKey(crypto.randomUUID());
  }, [open]);
  return key;
}

export const todayIso = () => iso(new Date());
