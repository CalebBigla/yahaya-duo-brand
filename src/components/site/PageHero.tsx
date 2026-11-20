import type { ReactNode } from "react";
import { ResponsiveImage, type ResponsiveSource } from "./ResponsiveImage";

/**
 * Interior page hero.
 *
 * With `image`: a full-bleed photo under a gradient scrim (at most ~55% on the text
 * side, lighter elsewhere) so the photo stays visible and the ivory text stays above
 * 4.5:1. The header sits transparently over it on routes listed in Navbar's
 * OVERLAY_ROUTES.
 * Without `image`: a quiet ivory hero for text pages (contact, enquire, legal).
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
  mobileImage,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  image?: ResponsiveSource;
  mobileImage?: ResponsiveSource;
  actions?: ReactNode;
}) {
  if (!image) {
    return (
      <section className="border-b border-border bg-background pb-14 pt-16 md:pb-20 md:pt-24">
        <div className="container-page">
          <div className="max-w-3xl">
            {eyebrow && <p className="t-eyebrow animate-fade-up text-accent-ink">{eyebrow}</p>}
            <h1 className={`t-h1 animate-fade-up stagger-2 text-primary ${eyebrow ? "mt-4" : ""}`}>{title}</h1>
            {subtitle && <p className="t-lead animate-fade-up stagger-3 mt-6 measure text-muted-foreground">{subtitle}</p>}
            {actions && <div className="animate-fade-up stagger-4 mt-10 flex flex-wrap items-center gap-4 sm:gap-8">{actions}</div>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative isolate flex min-h-[min(72svh,720px)] items-end overflow-hidden bg-primary-deep">
      <ResponsiveImage
        image={image}
        {...(mobileImage ? { mobile: mobileImage } : {})}
        alt=""
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20"
        imgClassName="h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary-deep/90 via-primary-deep/55 to-primary-deep/20 md:bg-gradient-to-r md:from-primary-deep/80 md:via-primary-deep/45 md:to-primary-deep/5" />
      <div className="container-page w-full pb-14 pt-32 md:pb-20">
        <div className="max-w-2xl">
          {eyebrow && <p className="t-eyebrow animate-fade-up text-accent">{eyebrow}</p>}
          <h1 className={`t-h1 animate-fade-up stagger-2 text-ivory ${eyebrow ? "mt-4" : ""}`}>{title}</h1>
          {subtitle && <p className="t-lead animate-fade-up stagger-3 mt-6 text-on-navy-muted">{subtitle}</p>}
          {actions && <div className="animate-fade-up stagger-4 mt-10 flex flex-wrap items-center gap-4 sm:gap-8">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
