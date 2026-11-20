import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { MessageCircle, Phone, PhoneCall, X } from "lucide-react";
import { brand } from "@/lib/brand";
import { useSiteSettings } from "@/lib/useSiteSettings";

/**
 * "Speak to an advisor": a calm pill that appears once the visitor scrolls past the
 * hero and opens a small sheet with WhatsApp, a call, or a call-back request.
 * Replaces the pulsing WhatsApp bubble. Hidden on the enquiry page itself.
 */
export function AdvisorButton() {
  const settings = useSiteSettings();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  if (pathname.startsWith("/quote")) return null;

  const option =
    "flex min-h-12 items-center gap-3 rounded-sm px-3 text-[0.9375rem] text-primary transition-colors hover:bg-secondary";

  return (
    <div
      className={`fixed bottom-5 right-5 z-40 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)] sm:bottom-6 sm:right-6 ${
        visible || open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            tabIndex={visible || open ? 0 : -1}
            className="btn-interactive inline-flex min-h-12 items-center gap-2.5 rounded-full bg-primary pl-4 pr-5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary-deep"
          >
            {open ? <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> : <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />}
            {brand.advisorAction}
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            side="top"
            align="end"
            sideOffset={10}
            className="z-50 w-[min(20rem,calc(100vw-2.5rem))] rounded-lg border border-border bg-card p-2 shadow-soft outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2"
          >
            <p className="px-3 pb-2 pt-2 t-small text-muted-foreground">
              An advisor replies {brand.responseTime}. Choose how to reach us.
            </p>
            <a href={settings.whatsappUrl()} target="_blank" rel="noopener noreferrer" className={option}>
              <MessageCircle className="h-5 w-5 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
              Message on WhatsApp
            </a>
            <a href={settings.telHref} className={option}>
              <Phone className="h-5 w-5 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
              Call {settings.primaryPhone}
            </a>
            <Link to="/quote" className={option} onClick={() => setOpen(false)}>
              <PhoneCall className="h-5 w-5 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
              Request a call-back
            </Link>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}
