import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Facebook, Instagram } from "lucide-react";
import { site, travelServices, tradeServices, whatsappLink } from "@/lib/site";

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
          
          {/* Social Media Icons */}
          <div className="mt-6 flex items-center gap-4">
            <a
              href="https://facebook.com/yahayatravelandtrade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground/70 hover:text-accent transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href={whatsappLink("Hello Yahaya! I would like to make an enquiry.")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground/70 hover:text-accent transition-colors"
              aria-label="WhatsApp"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </a>
            <a
              href="https://instagram.com/yahayatravelandtrade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground/70 hover:text-accent transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </div>
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
