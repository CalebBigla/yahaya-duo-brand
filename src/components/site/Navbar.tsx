import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Plane, Ship } from "lucide-react";
import { Logo } from "./Logo";

const linkBase =
  "text-sm font-semibold text-foreground/80 transition-all hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? "glass border-border/50 shadow-lg"
          : "border-border bg-background/95 backdrop-blur"
      } supports-[backdrop-filter]:bg-background/80`}
    >
      <div className="container-page flex h-18 items-center justify-between py-3">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          <Link to="/" className={linkBase} activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
            Home
          </Link>

          <div className="flex items-center gap-1 rounded-full border border-border bg-secondary p-1">
            <Link
              to="/travel"
              className="flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-foreground/80 transition-colors hover:text-primary"
              activeProps={{ className: "bg-primary text-primary-foreground hover:text-primary-foreground" }}
            >
              <Plane className="h-4 w-4" /> Travel
            </Link>
            <Link
              to="/trade"
              className="flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-foreground/80 transition-colors hover:text-primary"
              activeProps={{ className: "bg-primary text-primary-foreground hover:text-primary-foreground" }}
            >
              <Ship className="h-4 w-4" /> Trade
            </Link>
          </div>

          <Link to="/about" className={linkBase} activeProps={{ className: "text-primary" }}>
            About
          </Link>
          <Link to="/contact" className={linkBase} activeProps={{ className: "text-primary" }}>
            Contact
          </Link>
          <Link
            to="/quote"
            className="btn-interactive rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground"
          >
            Get a Quote
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-border bg-background lg:hidden" aria-label="Mobile">
          <div className="container-page flex flex-col gap-1 py-4">
            <Link to="/" onClick={close} className="rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-secondary">
              Home
            </Link>
            <p className="mt-3 px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Travel Division
            </p>
            <Link to="/travel" onClick={close} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-secondary">
              <Plane className="h-4 w-4 text-accent" /> Travel Services
            </Link>
            <p className="mt-3 px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Trade Division
            </p>
            <Link to="/trade" onClick={close} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-secondary">
              <Ship className="h-4 w-4 text-accent" /> Trade &amp; General Contracts
            </Link>
            <div className="mt-3 h-px bg-border" />
            <Link to="/about" onClick={close} className="rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-secondary">
              About
            </Link>
            <Link to="/contact" onClick={close} className="rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-secondary">
              Contact
            </Link>
            <Link
              to="/quote"
              onClick={close}
              className="mt-2 rounded-md bg-accent px-3 py-2.5 text-center text-sm font-bold text-accent-foreground"
            >
              Get a Quote
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
