import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A single, quiet entrance for headings and media: opacity 0 -> 1 and a 12px rise
 * over 500ms, once, when the element first scrolls into view. Content already in
 * view on load is shown immediately. Disabled for reduced-motion users (and the
 * global reduced-motion rule shortens it anyway).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  /** Milliseconds; keep stagger at or below 80ms between siblings. */
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "figure";
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setShown(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // @ts-expect-error -- ref type differs per tag; all are HTMLElements.
      ref={ref}
      className={`transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      } ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
