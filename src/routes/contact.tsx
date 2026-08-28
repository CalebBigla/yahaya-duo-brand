import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { site, generalWhatsapp } from "@/lib/site";

const title = "Contact Yahaya Travel and Trade Co Ltd | Jimeta-Yola, Adamawa";
const description =
  "Call, WhatsApp, email or visit our office at B.M Yelwa Plaza, Opp. Bachure Junction, Jimeta-Yola, Adamawa State for travel or trade enquiries.";

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

function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to our team"
        subtitle="Call, message on WhatsApp, email, or walk into the office in Jimeta-Yola. Travel or trade — we will point you to the right desk."
      />

      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-bold text-primary">Office</h2>
              <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {site.addressLine}
              </p>
              <div className="mt-4 space-y-2">
                {site.phones.map((p) => (
                  <a key={p} href={`tel:${p}`} className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent-foreground">
                    <Phone className="h-4 w-4 text-accent" />
                    {p}
                  </a>
                ))}
                <a href={generalWhatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent-foreground">
                  <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  +234 912 765 0968
                </a>
              </div>
              <a
                href={`mailto:${site.email}`}
                className="mt-4 flex items-center gap-2 break-all text-sm font-semibold text-foreground hover:text-accent-foreground"
              >
                <Mail className="h-4 w-4 shrink-0 text-accent" />
                {site.email}
              </a>
              <a
                href={generalWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-primary">
                <Clock className="h-5 w-5 text-accent" /> Business hours
              </h2>
              <ul className="mt-4 space-y-2 text-sm">
                {site.hours.map((h) => (
                  <li key={h.days} className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
                    <span className="font-semibold text-foreground">{h.days}</span>
                    <span className="text-muted-foreground">{h.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <InquiryForm
            title="Send us a message"
            description="Tell us which division you need and we will respond promptly."
            intro="Hello Yahaya! I would like to make an enquiry."
            fields={[
              { name: "name", label: "Full name", required: true },
              { name: "phone", label: "Phone number", type: "tel", required: true },
              { name: "email", label: "Email address", type: "email" },
              {
                name: "division",
                label: "Division of interest",
                type: "select",
                required: true,
                options: ["Travel Services", "Trade & General Contracts"],
              },
              { name: "message", label: "Message", type: "textarea", required: true },
            ]}
          />

          {/* What happens next explainer */}
          <div className="mt-6 rounded-xl border border-primary-foreground/20 bg-primary-deep p-5">
            <h3 className="font-bold text-primary-foreground">What happens after you send</h3>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/75">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Your message opens in WhatsApp — review it and press send. Nothing is stored on this website.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                We respond within 24 hours on business days (Mon-Sat), typically much sooner.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                For urgent cases (tight visa deadlines, time-sensitive procurement), call us directly and we'll prioritize your request.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                We'll ask clarifying questions, provide initial guidance, and send you a clear quote if costs are involved — no hidden fees.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-page">
          <div className="overflow-hidden rounded-xl border border-border shadow-card">
            <iframe
              title="Yahaya Travel and Trade office location on Google Maps"
              src={`https://maps.google.com/maps?q=${site.mapQuery}&output=embed`}
              width="100%"
              height="420"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ border: 0 }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
