import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface FlipCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  frontDescription: string;
  backContent: ReactNode;
  accentColor?: "primary" | "accent" | "secondary";
  className?: string;
}

export function FlipCard({
  icon: Icon,
  title,
  subtitle,
  frontDescription,
  backContent,
  accentColor = "accent",
  className,
}: FlipCardProps) {
  const accentClasses = {
    primary: "from-primary via-primary-deep to-primary",
    accent: "from-accent via-accent/90 to-accent",
    secondary: "from-secondary via-secondary/80 to-muted",
  };

  return (
    <div className={cn("group relative h-[400px] sm:h-[420px] md:h-[380px]", className)}>
      {/* Back Content - Always Visible Behind */}
      <div className={cn(
        "absolute inset-0 rounded-2xl sm:rounded-3xl border border-accent/30 bg-gradient-to-br p-6 sm:p-8 shadow-card opacity-0 transition-opacity duration-500 group-hover:opacity-100",
        accentClasses[accentColor]
      )}>
        <div className="flex h-full flex-col text-white">
          {/* Back content with staggered reveals */}
          <div className="translate-y-2 opacity-0 transition-all delay-100 duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <Icon className="mb-3 sm:mb-4 h-8 w-8 sm:h-10 sm:w-10 opacity-90" strokeWidth={2} />
            <h3 className="text-lg sm:text-xl font-bold">{title}</h3>
          </div>

          <div className="mt-3 sm:mt-4 flex-1 translate-y-2 opacity-0 overflow-y-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/30 transition-all delay-200 duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            {backContent}
          </div>

          {/* Decorative corner accent */}
          <div className="absolute bottom-0 right-0 h-24 w-24 sm:h-32 sm:w-32 opacity-10">
            <Icon className="h-full w-full" strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* Front Card - Scales and Offsets on Hover */}
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-6 sm:p-8 shadow-elevated transition-all duration-500 ease-out group-hover:scale-[0.85] group-hover:-translate-x-3 group-hover:-translate-y-3 group-hover:shadow-2xl">
        <div className="flex h-full flex-col">
          {/* Icon with glow effect */}
          <div className="relative mb-4 sm:mb-6">
            <div className="absolute inset-0 animate-pulse rounded-xl sm:rounded-2xl bg-accent/20 blur-xl transition-all duration-500 group-hover:bg-accent/30" />
            <div className={cn(
              "relative flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br shadow-card transition-all duration-500 group-hover:scale-90",
              accentClasses[accentColor]
            )}>
              <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white transition-transform duration-500 group-hover:rotate-12" strokeWidth={2.5} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <span className="inline-block rounded-full bg-accent-soft px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-accent-foreground transition-all duration-300 group-hover:bg-accent group-hover:text-white">
              {subtitle}
            </span>
            <h3 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-primary transition-colors duration-300 group-hover:text-accent">
              {title}
            </h3>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground transition-opacity duration-300 group-hover:opacity-70">
              {frontDescription}
            </p>
          </div>

          {/* Hover indicator */}
          <div className="mt-4 sm:mt-6 flex items-center gap-2 text-[10px] sm:text-xs font-bold text-accent transition-all duration-300 group-hover:gap-3">
            <span>Hover to explore</span>
            <svg
              className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse-slow transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
