import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ChevronDown, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { brand } from "@/lib/brand";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { getPublishedFAQs } from "@/lib/queries/website";

const title = "Contact | Yahaya Travel & Trade, Jimeta-Yola";
const description =
  "Speak to an advisor by WhatsApp, phone or email, or visit the office at B.M Yelwa Plaza, Opp. Bachure Junction, Jimeta-Yola, Adamawa State.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function Channel({
  icon: Icon,
  label,
  value,
  note,
  href,
  external,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="card-interactive group flex h-full flex-col rounded-lg border border-border bg-card p-7"
    >
      <div className="flex items-center justify-between">
        <Icon className="h-6 w-6 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <p className="t-eyebrow mt-6 text-accent-ink">{label}</p>
      <p className="mt-2 break-words font-display text-xl text-primary">{value}</p>
      <p className="t-small mt-2 text-muted-foreground">{note}</p>
    </a>
  );
}

function ContactPage() {
  const s = useSiteSettings();
  const { data: faqs } = useQuery({ queryKey: ["website", "faqs"], queryFn: getPublishedFAQs, staleTime: 60_000 });
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.addressLine)}`;

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={brand.advisorAction}
        subtitle={`Choose whichever is easiest. An advisor will reply ${brand.responseTime}, and urgent visa or supply deadlines are best handled by phone.`}
      />

      <Section id="channels">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <li>
            <Channel icon={MessageCircle} label="WhatsApp" value="Message an advisor" note="Quickest for documents and photos" href={s.whatsappUrl()} external />
          </li>
          <li>
            <Channel icon={Phone} label="Call" value={s.primaryPhone} note="During opening hours" href={s.telHref} />
          </li>
          <li>
            <Channel icon={Mail} label="Email" value={s.email} note="For detailed requirements and files" href={`mailto:${s.email}`} />
          </li>
          <li>
            <Channel icon={MapPin} label="Visit" value="Jimeta-Yola office" note={s.addressLine} href={mapsUrl} external />
          </li>
        </ul>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="t-h3 text-primary">Opening hours</h2>
            <dl className="mt-6 divide-y divide-border border-y border-border">
              {s.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4 py-4">
                  <dt className="text-muted-foreground">{h.days}</dt>
                  <dd className="font-semibold text-primary">{h.time}</dd>
                </div>
              ))}
            </dl>
            <p className="t-small mt-6 text-muted-foreground">
              Planning a trip or a supply order?{" "}
              <Link to="/quote" className="link-draw font-semibold text-primary">
                Start an enquiry
              </Link>{" "}
              and the right desk will pick it up.
            </p>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <iframe
              title="Office location on Google Maps"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(s.addressLine)}&output=embed`}
              width="100%"
              height="380"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-[380px] w-full border-0"
            />
          </div>
        </div>
      </Section>

      {faqs && faqs.length > 0 && (
        <Section id="faqs" tone="sand" title="Questions clients ask">
          <div className="max-w-3xl divide-y divide-border border-y border-border">
            {faqs.map((faq) => (
              <details key={faq.id} className="group">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-xl text-primary [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-180" strokeWidth={1.5} aria-hidden="true" />
                </summary>
                <p className="t-body measure pb-6 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </Section>
      )}

      <Section id="message" tone="navy" eyebrow="Message" title="Or leave a message">
        <div className="max-w-3xl">
          <InquiryForm
            title="Send a message"
            description="Tell us which desk you need and how to reach you."
            formType="contact"
            fields={[
              { name: "name", label: "Full name", required: true },
              { name: "phone", label: "Phone number", type: "tel", required: true },
              { name: "email", label: "Email address", type: "email" },
              {
                name: "division",
                label: "Desk",
                type: "select",
                required: true,
                options: [brand.desks.travel.name, brand.desks.trade.name],
              },
              { name: "message", label: "Message", type: "textarea", required: true },
            ]}
          />
        </div>
      </Section>
    </>
  );
}
