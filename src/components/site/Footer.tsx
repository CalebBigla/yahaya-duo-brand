import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { site, travelServices, tradeServices } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-primary-deep text-primary-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl font-extrabold tracking-[0.18em]">YAHAYA</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Travel &amp; Trade Co Ltd
          </p>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">
            Visas processed, cargo moved, deals sourced. One registered Nigerian company,
            two dedicated divisions.
          </p>
          <p className="mt-4 text-xs font-semibold text-primary-foreground/60">
            RC {site.rcNumber}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-accent">Travel Services</h3>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
            {travelServices.map((s) => (
              <li key={s.slug}>
                <Link to="/travel" hash={s.slug} className="hover:text-accent">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-accent">Trade Services</h3>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
            {tradeServices.map((s) => (
              <li key={s.slug}>
                <Link to="/trade" hash={s.slug} className="hover:text-accent">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-accent">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/75">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{site.addressLine}</span>
            </li>
            {site.phones.map((p) => (
              <li key={p} className="flex gap-2">
                <Phone className="h-4 w-4 shrink-0 text-accent" />
                <a href={`tel:${p}`} className="hover:text-accent">
                  {p}
                </a>
              </li>
            ))}
            <li className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <a href={`mailto:${site.email}`} className="break-all hover:text-accent">
                {site.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-primary-foreground/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. RC {site.rcNumber}. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-accent">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-accent">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
