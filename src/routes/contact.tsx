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
