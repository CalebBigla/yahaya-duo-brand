import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { ButtonLink } from "./Button";
import { brand } from "@/lib/brand";
import { useSiteSettings } from "@/lib/useSiteSettings";

const heading = "t-eyebrow text-accent";
const linkClass = "link-draw text-on-navy-muted hover:text-ivory";

export function Footer() {
  const s = useSiteSettings();

  return (
    <footer className="bg-primary-deep text-ivory">
      <div className="container-page py-20 md:py-24">
        <div className="flex flex-col gap-10 border-b border-ivory/10 pb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <Logo variant="dark" />
            <p className="mt-6 font-display text-2xl leading-snug text-ivory">{brand.promise}</p>
          </div>
          <ButtonLink to="/quote" variant="onDark">
            {brand.advisorAction}
          </ButtonLink>
        </div>

        <div className="grid gap-12 pt-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className={heading}>Visit</h2>
            <address className="mt-5 t-small not-italic leading-relaxed text-on-navy-muted">{s.addressLine}</address>
            <dl className="mt-5 space-y-1 t-small text-on-navy-muted">
              {s.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4">
                  <dt>{h.days}</dt>
                  <dd className="text-ivory">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className={heading}>Contact</h2>
            <ul className="mt-5 space-y-3 t-small">
              {s.phones.map((p) => (
                <li key={p}>
                  <a href={`tel:${p.replace(/\s/g, "")}`} className={linkClass}>
                    {p}
                  </a>
                </li>
              ))}
              <li>
                <a href={s.whatsappUrl()} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${s.email}`} className={`${linkClass} break-all`}>
                  {s.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className={heading}>Desks</h2>
            <ul className="mt-5 space-y-3 t-small">
              <li>
                <Link to={brand.desks.travel.path} className={linkClass}>
                  {brand.desks.travel.name}
                </Link>
              </li>
              <li>
                <Link to={brand.desks.trade.path} className={linkClass}>
                  {brand.desks.trade.name}
                </Link>
              </li>
              <li>
                <Link to="/about" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <Link to="/quote" className={linkClass}>
                  Enquire
                </Link>
              </li>
            </ul>
          </div>

          {s.socials.length > 0 && (
            <div>
              <h2 className={heading}>Follow</h2>
              <ul className="mt-5 space-y-3 t-small">
                {s.socials.map((social) => (
                  <li key={social.label}>
                    <a href={social.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-page flex flex-col gap-3 py-6 t-small text-on-navy-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {s.name}. RC {s.rcNumber}.
          </p>
          <ul className="flex gap-6">
            <li>
              <Link to="/privacy" className={linkClass}>
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className={linkClass}>
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
