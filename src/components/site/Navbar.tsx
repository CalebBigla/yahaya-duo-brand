import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { Logo } from "./Logo";
import { ButtonLink } from "./Button";
import { brand } from "@/lib/brand";
import { getPublishedGallery } from "@/lib/queries/website";
import { useSiteSettings } from "@/lib/useSiteSettings";

/** Pages whose first section is a full-bleed photo: the header sits transparently over it. */
const OVERLAY_ROUTES = new Set(["/", "/travel", "/trade"]);

// The dialog code loads on the first tap of the menu button, not with every page.
const MobileMenu = lazy(() => import("./MobileMenu"));

export const HEADER_HEIGHT = "4.5rem"; // 72px

export function Header() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
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

        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => {
            setMenuLoaded(true);
            setMenuOpen(true);
          }}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-sm lg:hidden ${overlay ? "text-ivory" : "text-primary"}`}
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
        >
          <Menu className="h-6 w-6" strokeWidth={1.5} />
        </button>
        {menuLoaded && (
          <Suspense fallback={null}>
            <MobileMenu
              open={menuOpen}
              onOpenChange={setMenuOpen}
              links={links}
              telHref={settings.telHref}
              phone={settings.primaryPhone}
              returnFocusTo={menuButtonRef.current}
            />
          </Suspense>
        )}
      </div>
    </header>
  );
}

/** Kept for existing imports (404 page). */
export const Navbar = Header;
