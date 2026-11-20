import { useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X, Plane, Ship, ArrowRight } from "lucide-react";
import { Logo } from "./Logo";

const linkBase =
  "link-underline py-1 text-sm font-medium text-foreground/75 transition-colors hover:text-primary";

const mobileLink =
  "flex min-h-12 items-center gap-3 rounded-lg px-3 text-[0.9375rem] font-medium text-foreground transition-colors hover:bg-secondary";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const close = () => setOpen(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the mobile menu after navigating, and with the Escape key.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled || open
          ? "glass border-border/70 shadow-[0_6px_24px_-12px_oklch(0.22_0.06_260/0.25)]"
          : "border-transparent bg-background"
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between lg:h-[4.5rem]">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          <Link
            to="/"
            className={linkBase}
            activeProps={{ className: "text-primary", "aria-current": "page" }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>

          <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/70 p-1">
            {[
              { to: "/travel" as const, label: "Travel", Icon: Plane },
              { to: "/trade" as const, label: "Trade", Icon: Ship },
            ].map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-foreground/75 transition-[background-color,color,box-shadow] duration-200 hover:bg-card hover:text-primary"
                activeProps={{
                  className: "!bg-primary !text-primary-foreground shadow-sm",
                }}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} /> {label}
              </Link>
            ))}
          </div>

          <Link to="/about" className={linkBase} activeProps={{ className: "text-primary", "aria-current": "page" }}>
            About
          </Link>
          <Link to="/contact" className={linkBase} activeProps={{ className: "text-primary", "aria-current": "page" }}>
            Contact
          </Link>
          <Link to="/media" className={linkBase} activeProps={{ className: "text-primary", "aria-current": "page" }}>
            Media
          </Link>
          <Link
            to="/quote"
            className="btn-interactive group inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-deep"
          >
            Get a Quote <ArrowRight className="arrow-nudge h-4 w-4" />
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="animate-fade-in max-h-[calc(100svh-4rem)] overflow-y-auto border-t border-border bg-background lg:hidden"
          aria-label="Mobile"
        >
          <div className="container-page flex flex-col gap-1 py-4">
            <Link to="/" onClick={close} className={mobileLink} activeOptions={{ exact: true }} activeProps={{ className: "bg-secondary text-primary" }}>
              Home
            </Link>
            <div className="my-2 grid grid-cols-2 gap-2">
              <Link
                to="/travel"
                onClick={close}
                className="flex min-h-14 flex-col justify-center rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-accent/50"
                activeProps={{ className: "!border-primary" }}
              >
                <Plane className="h-5 w-5 text-accent-ink" strokeWidth={1.75} />
                <span className="mt-2 text-sm font-semibold text-primary">Travel Services</span>
              </Link>
              <Link
                to="/trade"
                onClick={close}
                className="flex min-h-14 flex-col justify-center rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-accent/50"
                activeProps={{ className: "!border-primary" }}
              >
                <Ship className="h-5 w-5 text-accent-ink" strokeWidth={1.75} />
                <span className="mt-2 text-sm font-semibold text-primary">Trade Activities</span>
              </Link>
            </div>
            <Link to="/about" onClick={close} className={mobileLink} activeProps={{ className: "bg-secondary text-primary" }}>
              About
            </Link>
            <Link to="/contact" onClick={close} className={mobileLink} activeProps={{ className: "bg-secondary text-primary" }}>
              Contact
            </Link>
            <Link to="/media" onClick={close} className={mobileLink} activeProps={{ className: "bg-secondary text-primary" }}>
              Media
            </Link>
            <Link
              to="/quote"
              onClick={close}
              className="mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Get a Quote <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
