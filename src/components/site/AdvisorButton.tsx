import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { MessageCircle, Phone, PhoneCall, X } from "lucide-react";
import { brand } from "@/lib/brand";
import { useSiteSettings } from "@/lib/useSiteSettings";

/**
 * "Speak to an advisor": a calm pill that appears once the visitor scrolls past the
 * hero and discloses three ways to reach us (WhatsApp, call, call-back request).
 * Replaces the pulsing WhatsApp bubble. A plain disclosure (no popover library), so
 * it adds almost nothing to every page: Escape and clicking outside close it and
 * focus returns to the button.
 */
export function AdvisorButton() {
  const settings = useSiteSettings();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  if (pathname.startsWith("/quote")) return null;

  const shown = visible || open;
  const option = "flex min-h-12 items-center gap-3 rounded-sm px-3 text-[0.9375rem] text-primary transition-colors hover:bg-secondary";

  return (
    <div
      ref={rootRef}
      className={`fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)] sm:bottom-6 sm:right-6 ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      {open && (
        <div
          id={panelId}
          className="w-[min(20rem,calc(100vw-2.5rem))] animate-fade-up rounded-lg border border-border bg-card p-2 shadow-soft"
        >
          <p className="t-small px-3 pb-2 pt-2 text-muted-foreground">An advisor replies {brand.responseTime}.</p>
          <ul>
            <li>
              <a href={settings.whatsappUrl()} target="_blank" rel="noopener noreferrer" className={option}>
                <MessageCircle className="h-5 w-5 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
                Message on WhatsApp
              </a>
            </li>
            <li>
              <a href={settings.telHref} className={option}>
                <Phone className="h-5 w-5 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
                Call {settings.primaryPhone}
              </a>
            </li>
            <li>
              <Link to="/quote" className={option}>
                <PhoneCall className="h-5 w-5 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
                Request a call-back
              </Link>
            </li>
          </ul>
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        tabIndex={shown ? 0 : -1}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="btn-interactive inline-flex min-h-12 items-center gap-2.5 rounded-full bg-primary pl-4 pr-5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary-deep"
      >
        {open ? <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> : <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />}
        {brand.advisorAction}
      </button>
    </div>
  );
}
