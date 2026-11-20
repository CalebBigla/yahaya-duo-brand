import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

type Tone = "ivory" | "white" | "sand" | "navy";

const tones: Record<Tone, string> = {
  ivory: "bg-background text-foreground",
  white: "bg-card text-foreground",
  sand: "bg-secondary text-foreground",
  navy: "bg-primary text-primary-foreground",
};

/**
 * One idea per section. Consistent vertical rhythm (128px desktop, 72px mobile) and a
 * 1200px content width. Optional heading block: eyebrow, title and a short intro.
 */
export function Section({
  id,
  tone = "ivory",
  eyebrow,
  title,
  intro,
  align = "left",
  action,
  children,
  className = "",
  labelledBy,
}: {
  id?: string;
  tone?: Tone;
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  const onNavy = tone === "navy";
  const headingId = labelledBy ?? (id ? `${id}-title` : undefined);
  return (
    <section
      id={id}
      aria-labelledby={title && headingId ? headingId : undefined}
      className={`py-[72px] md:py-32 ${tones[tone]} ${className}`}
    >
      <div className="container-page">
        {(eyebrow || title || intro) && (
          <Reveal>
            <header
              className={`mb-12 flex flex-col gap-6 md:mb-16 ${
                align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"
              }`}
            >
              <div className={align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}>
                {eyebrow && <p className={`t-eyebrow ${onNavy ? "text-accent" : "text-accent-ink"}`}>{eyebrow}</p>}
                {title && (
                  <h2 id={headingId} className={`t-h2 ${eyebrow ? "mt-4" : ""} ${onNavy ? "text-ivory" : "text-primary"}`}>
                    {title}
                  </h2>
                )}
                {intro && (
                  <p className={`t-body mt-5 measure ${onNavy ? "text-on-navy-muted" : "text-muted-foreground"} ${align === "center" ? "mx-auto" : ""}`}>
                    {intro}
                  </p>
                )}
              </div>
              {action && <div className="shrink-0">{action}</div>}
            </header>
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
