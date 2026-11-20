import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDown, BadgeCheck, Check, ChevronDown, Compass, Hotel, Map, Plane, type LucideIcon } from "lucide-react";

import { ButtonLink } from "@/components/site/Button";
import { InfoCard } from "@/components/site/InfoCard";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { CountryCarousel } from "@/components/travel/CountryCarousel";
import { brand } from "@/lib/brand";
import { images } from "@/lib/images";
import { site, toE164, travelServices } from "@/lib/site";
import { getPublishedServices, getPublishedVisaDestinations } from "@/lib/queries/website";

const title = `${brand.desks.travel.name} | Visas, Hajj, Umrah and travel from Yola | Yahaya`;
const description =
  "Private travel desk in Jimeta-Yola, Adamawa: visa processing, Hajj and Umrah, flights, hotels, tour packages and travel consultancy, arranged personally by Yahaya Travel and Trade Co Ltd.";

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
          name: `${site.name}, ${brand.desks.travel.name}`,
          description,
          telephone: toE164(site.phones[0]),
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

/** What each service covers. From the existing service pages. */
const serviceDetails: Record<string, { included: string[]; required: string; timeline: string }> = {
  "visa-processing": {
    included: [
      "A document checklist for your destination and visa category",
      "Application form review and completion",
      "Appointment booking at the embassy or visa application centre",
      "Document checks before submission to avoid rejections",
      "Tracking and follow-up until your passport is returned",
    ],
    required:
      "Valid passport (6+ months), passport photos, bank statements, travel itinerary, accommodation booking, invitation letter if applicable, and an employment letter or business registration.",
    timeline:
      "Varies by destination and application type. Dubai is typically 3–5 working days. We confirm a timeline for your case when you enquire.",
  },
  "flight-bookings": {
    included: [
      "Fares compared across major domestic and international airlines",
      "Economy, business or first class",
      "Multi-city and complex itineraries",
      "Date changes and rebooking",
      "E-tickets sent by email or WhatsApp",
    ],
    required:
      "Names as on the passport, passport number and expiry, preferred dates (and alternatives), destinations, and a phone number and email.",
    timeline:
      "Same day for most routes once payment is confirmed. Allow 1–2 business days for groups of 8 or more, or complex itineraries.",
  },
  "hotel-reservations": {
    included: [
      "Hotels and serviced apartments matched to your budget and location",
      "Corporate and group rates where available",
      "Confirmation in your name, with the cancellation policy stated",
      "Payment arranged directly or through us, depending on the hotel",
      "Changes and extensions if your stay changes",
    ],
    required: "City, dates, rooms and guests, budget range and location preferences.",
    timeline: "Within 24 hours for most destinations; allow 2–3 days in peak periods or for a specific property.",
  },
  "tour-packages": {
    included: [
      "Flights, accommodation, airport transfers and guided activities in one itinerary",
      "Visa processing where applicable",
      "Group coordination on a shared itinerary",
      "Travel insurance options",
      "An on-ground contact number for the whole trip",
    ],
    required: "Group size, destination, preferred period, budget per person and any sites or activities you want included.",
    timeline: "Allow 4–6 weeks for packages that need visas; 2–3 weeks for visa-free destinations.",
  },
  "travel-consultancy": {
    included: [
      "Route planning: cheapest, fastest or most convenient",
      "Entry requirements by destination (visa, vaccinations, passport validity)",
      "Travel insurance advice",
      "Packing and documentation checklists",
      "Advice by phone or WhatsApp while you travel",
    ],
    required: "Destinations, purpose of travel, approximate dates, nationality and passport validity, and any constraints.",
    timeline: "Straightforward questions are answered straight away; complex trips get a scheduled call or meeting.",
  },
};

const visaTypes = ["Umrah", "Hajj", "Tourism", "Study", "Work", "Business", "Transit"];

const visaChecklist = [
  "Valid passport with at least 6 months validity and blank pages",
  "Recent passport photos (white background; size depends on destination)",
  "Completed visa application form (we help with this)",
  "Bank statements (3–6 months, depending on destination)",
  "Employment letter or business registration documents",
  "Travel itinerary (flight and hotel bookings)",
  "Invitation letter, if visiting friends, family or business partners",
  "Proof of ties to Nigeria (property, family, employment)",
  "Travel insurance certificate (for some destinations)",
  "Marriage and birth certificates, if travelling with family",
  "Previous visas or travel history, if applicable",
  "Vaccination certificates (yellow fever and others as required)",
];

function Details({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="group mt-5 border-t border-border pt-4">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden">
        {summary}
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" strokeWidth={1.5} aria-hidden="true" />
      </summary>
      <div className="pt-2">{children}</div>
    </details>
  );
}

function TravelPage() {
  const [selected, setSelected] = useState("");
  const { data: publishedServices } = useQuery({
    queryKey: ["website", "services", "travel"],
    queryFn: () => getPublishedServices("travel"),
    staleTime: 60_000,
  });
  const {
    data: publishedVisaDestinations,
    isLoading: visaLoading,
    isError: visaError,
  } = useQuery({
    queryKey: ["website", "visa-destinations"],
    queryFn: getPublishedVisaDestinations,
    staleTime: 60_000,
  });

  const services = publishedServices ?? travelServices;
  const destinations = publishedVisaDestinations ?? [];
  const activeCountry = selected || destinations[0]?.country;
  const active = destinations.find((d) => d.country === activeCountry);

  return (
    <>
      <PageHero
        image={images.travelHero}
        mobileImage={images.homeHeroMobile}
        eyebrow={brand.desks.travel.name}
        title="Travel, arranged personally"
        subtitle={brand.desks.travel.summary}
        actions={
          <>
            <ButtonLink to="/quote" search={{ desk: "travel" } as never} variant="onDark">
              {brand.advisorAction}
            </ButtonLink>
            <ButtonLink to="/travel" hash="visas" variant="textOnDark">
              Visa quick reference <ArrowDown className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </ButtonLink>
          </>
        }
      />

      <Section id="services" title="What the desk arranges" intro="Everything around the journey, handled by one advisor from the first call to your return.">
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const details = serviceDetails[service.slug];
            return (
              <Reveal as="li" key={service.slug} delay={(i % 3) * 80}>
                <InfoCard id={service.slug} icon={icons[service.slug] ?? Plane} title={service.title}>
                  <p>{service.summary}</p>
                  {details && (
                    <Details summary="What's included">
                      <ul className="space-y-2 t-small">
                        {details.included.map((item) => (
                          <li key={item} className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <p className="t-small mt-4">
                        <span className="font-semibold text-primary">You provide: </span>
                        {details.required}
                      </p>
                      <p className="t-small mt-2">
                        <span className="font-semibold text-primary">Typical timeline: </span>
                        {details.timeline}
                      </p>
                    </Details>
                  )}
                </InfoCard>
              </Reveal>
            );
          })}
        </ul>
      </Section>

      <Section id="visas" tone="sand" title="Visas we process" intro="Select a destination for visa types, typical processing times and key notes.">
        {/* Borders drawn per cell, so an incomplete last row shows card background, not a grey hole. */}
        <ul className="grid overflow-hidden rounded-lg border-l border-t border-border bg-card sm:grid-cols-2 lg:grid-cols-4">
          {visaTypes.map((visa) => (
            <li key={visa} className="border-b border-r border-border px-6 py-5">
              <span className="block h-px w-6 bg-accent" aria-hidden="true" />
              <p className="mt-3 font-display text-lg text-primary">{visa} visa</p>
            </li>
          ))}
        </ul>

        <div className="mt-14">
          {visaLoading ? (
            <div className="grid gap-3 sm:grid-cols-3" aria-busy="true" aria-label="Loading visa destinations">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-sm bg-background/70" />
              ))}
            </div>
          ) : destinations.length > 0 ? (
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div role="group" aria-label="Destinations" className="flex flex-wrap content-start gap-2">
                {destinations.map((d) => (
                  <button
                    key={d.country}
                    type="button"
                    aria-pressed={activeCountry === d.country}
                    onClick={() => setSelected(d.country)}
                    className={`min-h-11 rounded-full border px-5 text-sm font-semibold transition-colors ${
                      activeCountry === d.country
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-primary/25 bg-card text-primary hover:border-primary"
                    }`}
                  >
                    {d.country}
                  </button>
                ))}
              </div>
              {active && (
                <div className="rounded-lg border border-border bg-card p-7" aria-live="polite">
                  <h3 className="t-h3 text-primary">{active.country}</h3>
                  <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <dt className="t-eyebrow text-accent-ink">Visa types</dt>
                      <dd className="mt-1 text-primary">{active.visa_types}</dd>
                    </div>
                    <div>
                      <dt className="t-eyebrow text-accent-ink">Typical processing</dt>
                      <dd className="mt-1 text-primary">{active.processing_time}</dd>
                    </div>
                  </dl>
                  {active.notes && <p className="t-small mt-5 border-t border-border pt-5 text-muted-foreground">{active.notes}</p>}
                  <p className="t-small mt-5 text-muted-foreground">Timelines are estimates and depend on your circumstances.</p>
                </div>
              )}
            </div>
          ) : (
            <p role={visaError ? "alert" : undefined} className="t-body text-muted-foreground">
              {visaError
                ? "Destination details are unavailable right now. Ask an advisor for the requirements for your trip."
                : "Destination details will be published soon. Ask an advisor for the requirements for your trip."}
            </p>
          )}
        </div>

        <details className="group mt-14 rounded-lg border border-border bg-card">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-7 font-display text-xl text-primary [&::-webkit-details-marker]:hidden">
            Visa application document checklist
            <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-180" strokeWidth={1.5} aria-hidden="true" />
          </summary>
          <div className="border-t border-border px-7 pb-7 pt-5">
            <p className="t-small text-muted-foreground">
              General requirements for most applications. When you enquire, we give you the exact list for your destination and check your documents before submission.
            </p>
            <ul className="mt-5 grid gap-x-8 gap-y-3 md:grid-cols-2">
              {visaChecklist.map((item) => (
                <li key={item} className="flex gap-3 t-small text-primary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </details>
      </Section>

      <Section id="destinations" title="Where we take people" intro="The destinations we arrange most often. Choose one to start an enquiry.">
        <CountryCarousel />
      </Section>

      <Section id="inquiry-form" tone="navy" eyebrow="Enquire" title="Tell us about your journey" intro={`An advisor will reply ${brand.responseTime}.`}>
        <div className="max-w-3xl">
          <InquiryForm
            title="Travel enquiry"
            description="Tell us where, when and who, and we will come back with requirements and options."
            formType="travel"
            fields={[
              { name: "name", label: "Full name", required: true },
              { name: "phone", label: "Phone number", type: "tel", required: true },
              { name: "email", label: "Email address", type: "email" },
              { name: "service", label: "Service needed", type: "select", required: true, options: services.map((s) => s.title) },
              { name: "dates", label: "Travel dates", type: "date" },
              { name: "destination", label: "Destination" },
              { name: "message", label: "Message", type: "textarea", placeholder: "Anything we should know" },
            ]}
          />
        </div>
      </Section>
    </>
  );
}
