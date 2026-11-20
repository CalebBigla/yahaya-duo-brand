import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Plain information card: optional icon, title, two or three lines. No image. */
export function InfoCard({
  icon: Icon,
  title,
  children,
  index,
  tone = "light",
  id,
}: {
  icon?: LucideIcon;
  title: string;
  children: ReactNode;
  /** Shows a step number (1, 2, 3) instead of an icon. */
  index?: number;
  tone?: "light" | "navy";
  id?: string;
}) {
  const onNavy = tone === "navy";
  return (
    <div
      id={id}
      className={`h-full rounded-lg border p-7 sm:p-8 ${
        onNavy ? "border-ivory/15 bg-white/[0.03]" : "border-border bg-card"
      }`}
    >
      {index !== undefined ? (
        <p className={`font-display text-2xl ${onNavy ? "text-accent" : "text-accent-ink"}`} aria-hidden="true">
          {String(index).padStart(2, "0")}
        </p>
      ) : Icon ? (
        <Icon className={`h-6 w-6 ${onNavy ? "text-accent" : "text-accent-ink"}`} strokeWidth={1.5} aria-hidden="true" />
      ) : null}
      <h3 className={`t-h3 ${Icon || index !== undefined ? "mt-5" : ""} ${onNavy ? "text-ivory" : "text-primary"}`}>{title}</h3>
      <div className={`t-body mt-3 ${onNavy ? "text-on-navy-muted" : "text-muted-foreground"}`}>{children}</div>
    </div>
  );
}
