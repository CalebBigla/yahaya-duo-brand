import { Loader2 } from "lucide-react";

/** Full-page loading state: the logotype and one quiet progress indicator. */
export function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-live="polite">
      <div className="text-center">
        <p className="font-display text-2xl tracking-[0.14em] text-primary">YAHAYA</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Travel &amp; Trade Co Ltd
        </p>
        <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}

export function PageLoadingState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} aria-hidden="true" />
        <span className="t-small">Loading</span>
      </div>
    </div>
  );
}
