import { useEffect, useState } from "react";
import portImg from "@/assets/trade.webp";
import dubaiImg from "@/assets/Dubai.webp";
import oilImg from "@/assets/The Last Bow at Dusk.webp";
import passportImg from "@/assets/travel.webp";

const SLIDES = [
  { src: portImg, label: "Trade · Shipping & logistics", position: "center 60%" },
  { src: dubaiImg, label: "Travel · Destinations", position: "center 40%" },
  { src: oilImg, label: "Trade · Oil & gas supply", position: "center 45%" },
  { src: passportImg, label: "Travel · Visas & flights", position: "center 40%" },
] as const;

const INTERVAL_MS = 7000;

// Flight route drawn across the hero, in the SVG's 1440 x 720 coordinate space.
// It runs below the text column and rises behind the photo collage, so it never crosses copy.
const ROUTE = "M -40 700 C 360 690, 700 660, 940 470 S 1260 130, 1500 60";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Decorative background for the home hero: travel and trade photos that crossfade
 * with a slow zoom, a navy wash for text contrast, and a plane flying a dashed route.
 * Only the first photo loads up front; the rest load once the page is idle.
 */
export function HeroBackdrop() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [loadRest, setLoadRest] = useState(false);

  useEffect(() => {
    const start = () => setLoadRest(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(start, 1500);
    return () => clearTimeout(t);
  }, []);

  // Advance the slides; paused for reduced motion and while the tab is hidden.
  useEffect(() => {
    if (reduced || !loadRest) return undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    const run = () => {
      clearInterval(timer);
      if (!document.hidden) timer = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    };
    run();
    document.addEventListener("visibilitychange", run);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, [reduced, loadRest, active]);

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden bg-primary-deep" aria-hidden="true">
        {SLIDES.map((slide, i) =>
          i === 0 || loadRest ? (
            <div
              key={slide.src}
              data-active={i === active}
              className="hero-slide absolute inset-0"
              style={{ opacity: i === active ? 1 : 0 }}
            >
              <img
                src={slide.src}
                alt=""
                decoding="async"
                {...(i === 0 ? { fetchPriority: "high" as const } : {})}
                className="h-full w-full object-cover will-change-transform"
                style={{ objectPosition: slide.position }}
              />
            </div>
          ) : null,
        )}

        {/* Navy wash: strong behind the text on the left, lighter on the right. */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-deep via-primary-deep/85 to-primary-deep/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-deep/90 via-transparent to-primary-deep/40" />

        {/* Flight route with a plane gliding along it. */}
        <svg
          className="absolute inset-0 hidden h-full w-full lg:block"
          viewBox="0 0 1440 720"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <path d={ROUTE} stroke="oklch(0.77 0.13 74 / 0.18)" strokeWidth="6" strokeLinecap="round" />
          <path
            className="hero-route"
            d={ROUTE}
            stroke="oklch(0.77 0.13 74 / 0.7)"
            strokeWidth="1.75"
            strokeDasharray="2 10"
            strokeLinecap="round"
          />
          {!reduced && (
            <g>
              {/* Plane glyph pointing along +x, so rotate="auto" follows the route. */}
              <path
                d="M14 0 L-6 -3 L-10 -11 L-14 -11 L-10 -2 L-16 -1.5 L-19 -5 L-22 -5 L-20 0 L-22 5 L-19 5 L-16 1.5 L-10 2 L-14 11 L-10 11 L-6 3 Z"
                fill="oklch(0.97 0.01 85)"
              />
              <animateMotion dur="16s" repeatCount="indefinite" rotate="auto" path={ROUTE} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
              <animate attributeName="opacity" dur="16s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.08;0.9;1" />
            </g>
          )}
        </svg>
      </div>

      {/* Slide indicator: which theme is showing, and a way to jump between them. */}
      {loadRest && (
        <div className="absolute inset-x-0 bottom-5 z-10 sm:bottom-7">
          <div className="container-page flex items-center gap-4">
            <p className="hidden text-xs font-medium tracking-wide text-primary-foreground/70 sm:block" aria-live="polite">
              {SLIDES[active]?.label}
            </p>
            <div className="flex gap-1.5 sm:ml-auto">
              {SLIDES.map((slide, i) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show ${slide.label}`}
                  aria-current={i === active}
                  className="group flex h-6 items-center"
                >
                  <span className="relative block h-1 w-8 overflow-hidden rounded-full bg-primary-foreground/25 transition-colors group-hover:bg-primary-foreground/40">
                    <span
                      key={i === active ? `on-${active}` : "off"}
                      data-active={i === active}
                      className={`hero-progress absolute inset-0 origin-left rounded-full bg-accent ${
                        i === active ? "" : "scale-x-0"
                      }`}
                      style={{ ["--hero-interval" as string]: `${INTERVAL_MS}ms` }}
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
