import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Plane,
  Hotel,
  Map,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { travelServices, site } from "@/lib/site";
import travelImg from "@/assets/travel.jpg";

const title = "Travel Services — Visa Processing & Flight Bookings in Yola | Yahaya";
const description =
  "Visa processing Yola, flight bookings Adamawa, hotel reservations, tour packages and travel consultancy from Yahaya Travel and Trade Co Ltd.";

export const Route = createFileRoute("/travel")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/travel" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/travel" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          name: `${site.name} — Travel Division`,
          description,
          telephone: `+234${site.phones[0].slice(1)}`,
          email: site.email,
          address: {
            "@type": "PostalAddress",
            streetAddress: site.address.street,
            addressLocality: site.address.locality,
            addressRegion: site.address.region,
            addressCountry: "NG",
          },
          makesOffer: travelServices.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.title, description: s.summary },
          })),
        }),
      },
    ],
  }),
  component: TravelPage,
});

const icons: Record<string, LucideIcon> = {
  "visa-processing": BadgeCheck,
  "flight-bookings": Plane,
  "hotel-reservations": Hotel,
  "tour-packages": Map,
  "travel-consultancy": Compass,
};

function TravelPage() {
  return (
    <>
      <PageHero
        eyebrow="Travel Division"
        title="Travel Services"
        subtitle="Visas, flights, hotels and full itineraries handled end to end — from our office in Jimeta-Yola to wherever you are going."
      />

      <section className="border-b border-border bg-secondary/60">
        <div className="container-page grid items-center gap-8 py-12 md:grid-cols-2 md:py-16">
          <img
            src={travelImg}
            alt="Traveller holding a passport and boarding pass"
            width={1200}
            height={912}
            loading="lazy"
            className="w-full rounded-xl object-cover shadow-card"
          />
          <div>
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">
              One desk for the whole journey
            </h2>
            <p className="mt-4 text-muted-foreground">
              Most travel problems are paperwork problems. We take the checklist off your hands —
              documentation, appointments, tickets, accommodation — and keep you informed at each
              stage until you are on the plane.
            </p>
            <ul className="mt-6 space-y-2 text-sm font-medium text-foreground/80">
              <li>• Clear, itemised costs before anything is booked</li>
              <li>• Support by phone, WhatsApp and email while you travel</li>
              <li>• Group and corporate arrangements welcome</li>
            </ul>
          </div>
        </div>
      </section>

      {travelServices.map((service, i) => {
        const Icon = icons[service.slug] ?? Plane;
        return (
          <section
            key={service.slug}
            id={service.slug}
            className={`scroll-mt-24 py-14 sm:py-16 ${i % 2 === 1 ? "bg-secondary/50" : "bg-background"}`}
          >
            <div className="container-page grid gap-6 md:grid-cols-[auto_1fr] md:gap-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-soft">
                <Icon className="h-7 w-7 text-accent-foreground" />
              </div>
              <div className="max-w-3xl">
                <h2 className="text-2xl font-bold text-primary sm:text-3xl">{service.title}</h2>
                <p className="mt-2 font-semibold text-accent-foreground/80">{service.summary}</p>
                <p className="mt-4 leading-relaxed text-muted-foreground">{service.detail}</p>
              </div>
            </div>
          </section>
        );
      })}

      <section className="bg-primary-deep py-16">
        <div className="container-page max-w-3xl">
          <InquiryForm
            title="Travel enquiry"
            description="Tell us about your trip and we will come back with requirements and pricing."
            intro="Hello Yahaya! I have a travel enquiry."
            fields={[
              { name: "name", label: "Full name", required: true },
              { name: "phone", label: "Phone number", type: "tel", required: true },
              { name: "email", label: "Email address", type: "email" },
              {
                name: "service",
                label: "Service needed",
                type: "select",
                required: true,
                options: travelServices.map((s) => s.title),
              },
              { name: "dates", label: "Travel dates", type: "date" },
              { name: "destination", label: "Destination" },
              { name: "message", label: "Message", type: "textarea", placeholder: "Any details we should know" },
            ]}
          />
        </div>
      </section>
    </>
  );
}
