export function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary/30 via-background to-secondary/20">
      <div className="text-center">
        {/* Animated Logo Placeholder */}
        <div className="relative mx-auto mb-6 h-20 w-20">
          <div className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
          <div className="relative flex h-full w-full items-center justify-center rounded-full bg-accent/10">
            <svg
              className="h-10 w-10 animate-pulse text-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="font-display text-xl font-bold text-primary">
          YAHAYA
        </h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Travel &amp; Trade Co LTD
        </p>
        
        {/* Animated Dots */}
        <div className="mt-6 flex items-center justify-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}

export function PageLoadingState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="relative mx-auto mb-4 h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
