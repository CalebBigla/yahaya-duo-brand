/**
 * Shared admin UI kit. One implementation of each pattern, used across modules:
 * page header, buttons, form fields, modal + modal frame, confirm dialog,
 * badges, and empty / loading / error states.
 *
 * Visual language: gray neutrals, brand blue for primary actions, links and the
 * active state, rose for destructive, emerald/amber for status.
 */
import { useCallback, useRef, useState, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle, Inbox, Loader2, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Class tokens
// ---------------------------------------------------------------------------

export const card =
  'rounded-xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.02] dark:border-white/10 dark:bg-gray-900';
export const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500 dark:border-white/10 dark:bg-gray-950 dark:text-white dark:disabled:bg-white/5';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100 dark:focus-visible:ring-offset-gray-950';
export const primaryButton = `${buttonBase} bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400`;
export const secondaryButton = `${buttonBase} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/5`;
export const dangerButton = `${buttonBase} bg-rose-600 text-white hover:bg-rose-700`;
export const iconButton =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white';

export const th = 'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400';
export const thRight = 'px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400';
export const td = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300';
export const tdRight = 'px-4 py-3 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300';

// ---------------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------------

/** The top of every admin page: title, one-line description, primary actions. */
export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-white">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

// ---------------------------------------------------------------------------
// Modal frame: makes an existing panel an accessible dialog
// ---------------------------------------------------------------------------

/**
 * Wraps a hand-built modal panel so it behaves like a proper dialog: Esc closes,
 * focus stays inside, the page behind does not scroll, screen readers announce
 * it, and it animates in. Clicking the backdrop does NOT close it, so a
 * half-filled form is never lost by a stray click.
 */
export function ModalFrame({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-gray-950/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onPointerDownOutside={(e) => e.preventDefault()}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 outline-none sm:p-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] motion-reduce:animate-none"
        >
          <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// Modal: header, scrolling body, sticky footer
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-gray-950/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          onPointerDownOutside={(e) => e.preventDefault()}
          className={`fixed left-1/2 top-1/2 z-50 flex max-h-[92dvh] w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] motion-reduce:animate-none dark:border-white/10 dark:bg-gray-900 ${
            wide ? 'max-w-3xl' : 'max-w-xl'
          }`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 dark:border-white/5">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-base font-semibold text-gray-900 dark:text-white">{title}</DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close className={iconButton} aria-label="Close">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3 sm:px-6 dark:border-white/5 dark:bg-white/[0.02]">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// Confirm dialog (replaces window.confirm)
// ---------------------------------------------------------------------------

interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  tone?: 'default' | 'danger';
}

/**
 * `const [confirm, confirmDialog] = useConfirm();`
 * `if (!(await confirm({ title: 'Publish?' }))) return;`
 * Render `{confirmDialog}` once in the component.
 */
export function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  const dialog = (
    <Modal
      open={options !== null}
      onOpenChange={(open) => !open && settle(false)}
      title={options?.title ?? ''}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={() => settle(false)}>
            Cancel
          </button>
          <button
            type="button"
            autoFocus
            className={options?.tone === 'danger' ? dangerButton : primaryButton}
            onClick={() => settle(true)}
          >
            {options?.confirmLabel ?? 'Confirm'}
          </button>
        </>
      }
    >
      {options?.tone === 'danger' ? (
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div className="text-sm text-gray-600 dark:text-gray-300">{options?.body}</div>
        </div>
      ) : (
        <div className="text-sm text-gray-600 dark:text-gray-300">{options?.body}</div>
      )}
    </Modal>
  );

  return [confirm, dialog];
}

// ---------------------------------------------------------------------------
// Form bits
// ---------------------------------------------------------------------------

export function Field({
  label,
  required,
  hint,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
    </label>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
      {message}
    </div>
  );
}

export function SubmitButton({ busy, children, form }: { busy: boolean; children: ReactNode; form?: string }) {
  return (
    <button type="submit" form={form} disabled={busy} className={primaryButton}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

export function EmptyState({ title, body, action, icon: Icon = Inbox }: { title: string; body: string; action?: ReactNode; icon?: typeof Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100 motion-reduce:animate-none dark:bg-white/5" />
      ))}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-medium underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export type BadgeTone = 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'violet';

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-gray-100 text-gray-700 ring-gray-500/20 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20',
};

export function Badge({ tone = 'neutral', children, title }: { tone?: BadgeTone; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors ${BADGE_TONE[tone]}`}>
      {children}
    </span>
  );
}
