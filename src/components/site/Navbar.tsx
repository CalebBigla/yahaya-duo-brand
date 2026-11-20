import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { ButtonLink } from "./Button";
import { brand } from "@/lib/brand";
import { getPublishedGallery } from "@/lib/queries/website";
import { useSiteSettings } from "@/lib/useSiteSettings";

/** Pages whose first section is a full-bleed photo: the header sits transparently over it. */
const OVERLAY_ROUTES = new Set(["/", "/travel", "/trade"]);

export const HEADER_HEIGHT = "4.5rem"; // 72px

export function Header() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const settings = useSiteSettings();

  // Media appears in the navigation only once the gallery has something in it.
  const { data: gallery } = useQuery({
    queryKey: ["website", "gallery"],
    queryFn: getPublishedGallery,
    staleTime: 60_000,
  });
  const showMedia = (gallery?.length ?? 0) > 0;

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const overlay = OVERLAY_ROUTES.has(pathname) && !scrolled && !menuOpen;
  const links = [
    { to: brand.desks.travel.path, label: brand.desks.travel.name },
    { to: brand.desks.trade.path, label: brand.desks.trade.name },
    { to: "/about" as const, label: "About" },
    ...(showMedia ? [{ to: "/media" as const, label: "Media" }] : []),
    { to: "/contact" as const, label: "Contact" },
  ];

  return (
    <header
      className={`${OVERLAY_ROUTES.has(pathname) ? "fixed" : "sticky"} inset-x-0 top-0 z-40 transition-[background-color,border-color,color] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
        overlay ? "border-b border-transparent bg-transparent" : "border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/85"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:text-primary"
      >
        Skip to content
      </a>
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-6">
        <Logo variant={overlay ? "dark" : "light"} />

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`link-draw text-[0.9375rem] font-medium ${overlay ? "text-ivory" : "text-primary"}`}
              activeProps={{ "aria-current": "page", className: "bg-[length:100%_1px]" }}
            >
              {l.label}
            </Link>
          ))}
          <ButtonLink to="/quote" variant={overlay ? "onDark" : "primary"} className="min-h-10 px-5 text-sm">
            {brand.advisorAction}
          </ButtonLink>
        </nav>

        <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogPrimitive.Trigger asChild>
            <button
              type="button"
              className={`inline-flex h-11 w-11 items-center justify-center rounded-sm lg:hidden ${overlay ? "text-ivory" : "text-primary"}`}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Content
              aria-describedby={undefined}
              className="fixed inset-0 z-50 flex flex-col bg-background outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-200 lg:hidden"
            >
              <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
              <div className="container-page flex h-[4.5rem] items-center justify-between">
                <Logo />
                <DialogPrimitive.Close className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-primary" aria-label="Close menu">
                  <X className="h-6 w-6" strokeWidth={1.5} />
                </DialogPrimitive.Close>
              </div>
              <nav aria-label="Main" className="container-page flex flex-1 flex-col pb-10 pt-6">
                <ul className="divide-y divide-border border-y border-border">
                  {links.map((l) => (
                    <li key={l.to}>
                      <Link
                        to={l.to}
                        onClick={() => setMenuOpen(false)}
                        className="flex min-h-16 items-center font-display text-2xl text-primary"
                        activeProps={{ "aria-current": "page" }}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto space-y-4 pt-10">
                  <ButtonLink to="/quote" className="w-full" onClick={() => setMenuOpen(false)}>
                    {brand.advisorAction}
                  </ButtonLink>
                  <p className="t-small text-center text-muted-foreground">
                    Or call{" "}
                    <a href={settings.telHref} className="font-semibold text-primary underline underline-offset-4">
                      {settings.primaryPhone}
                    </a>
                  </p>
                </div>
              </nav>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </div>
    </header>
  );
}

/** Kept for existing imports (404 page). */
export const Navbar = Header;
