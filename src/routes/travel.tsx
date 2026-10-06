import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Plane,
  Hotel,
  Map,
  Compass,
  Clock,
  FileText,
  CheckCircle2,
  ChevronDown,
  Download,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { CountryCarousel } from "@/components/travel/CountryCarousel";
import { TourPackagesCards } from "@/components/travel/TourPackagesCards";
import { travelServices, site } from "@/lib/site";
import { getPublishedServices, getPublishedVisaDestinations } from "@/lib/queries/website";
import travelImg from "@/assets/travel.jpg";

// Page hero image
import heroImg from "@/assets/Minimalist Travel Aesthetic _ Manifesting My Next Journey 🌍✨.jpg";

const title = "Visa Processing & Travel Services in Yola | Yahaya Travel & Trade";
const description =
  "Visa processing in Yola, Adamawa: tourist, business, study, and work visas. Flight bookings, hotel reservations, tour packages, and travel consultancy from Yahaya Travel and Trade Co Ltd, Jimeta-Yola.";

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

// Expanded service details with what's included, requirements, timeline, and examples
const serviceDetails = {
  "visa-processing": {
    included: [
      "Destination-specific document checklist tailored to your visa category",
      "Application form review and completion assistance",
      "Appointment booking at the embassy or visa application center",
      "Document verification before submission to avoid rejections",
      "Application tracking and follow-up throughout the process",
    ],
    required:
      "Valid passport (6+ months validity), passport photos, proof of funds (bank statements), travel itinerary, accommodation booking, invitation letter (if applicable), employment letter or business registration.",
    timeline:
      "Turkey Visa: Processing time varies depending on application type and processing conditions. Dubai Visa: Approximately 3–5 working days. We provide specific timelines when you enquire.",
    example:
      "Applying for a visa? We provide your document checklist, review your bank statements and invitation letter, help you complete the online application, book your appointment at the visa application center, and track the application until your passport is returned with the visa sticker.",
  },
  "flight-bookings": {
    included: [
      "Fare comparison across major airlines (domestic and international)",
      "Economy, business, or first-class bookings based on your budget",
      "Multi-city and complex itinerary arrangements",
      "Date change and rebooking coordination",
      "E-ticket issuance and confirmation sent to your email or WhatsApp",
    ],
    required:
      "Full names as they appear on passport, passport number and expiry date, preferred travel dates (plus flexible alternatives if possible), destination(s), contact phone and email.",
    timeline:
      "Same-day booking for most routes once payment is confirmed. For group bookings (8+ passengers) or complex multi-city itineraries, allow 1-2 business days for us to secure the best fares and confirm availability.",
    example:
      "Flying from Yola to London for a business trip? We compare fares on Ethiopian, Turkish, Emirates and other carriers, find the best routing and price, issue your e-ticket, and send you the itinerary. If your meeting date shifts, we rebook without you having to call the airline.",
  },
  "hotel-reservations": {
    included: [
      "Vetted hotels and serviced apartments matched to your budget and location",
      "Negotiated corporate and group rates where available",
      "Booking confirmation in your name with cancellation policy clearly stated",
      "Payment coordination (pay directly or through us, depending on hotel terms)",
      "Reservation modifications or extensions if your stay changes",
    ],
    required:
      "Destination city, check-in and check-out dates, number of rooms and guests, budget range, location preferences (near airport, city center, business district).",
    timeline:
      "Confirmed reservations within 24 hours for most destinations. For high-demand periods (conferences, holidays) or specific property requests, allow 2-3 days.",
    example:
      "Need accommodation in Dubai for a week-long trade expo? We identify hotels near the expo center, provide 3 options at different price points with breakfast included, book your preferred choice, and send the confirmation you can present at check-in or use for your visa application.",
  },
  "tour-packages": {
    included: [
      "Complete itinerary: flights, accommodation, airport transfers, and guided activities",
      "Visa processing included where applicable",
      "Group coordination (same itinerary for all travelers)",
      "Travel insurance options",
      "On-ground contact number for the duration of the trip",
    ],
    required:
      "Group size, destination, preferred travel period, budget per person, any specific activities or sites you want included (pilgrimage sites, tourist attractions, business visits).",
    timeline:
      "Allow 4-6 weeks for full package arrangements, especially for groups requiring visas. For domestic packages or visa-free destinations, 2-3 weeks is usually sufficient.",
    example:
      "Organizing a corporate retreat to Ghana for 12 staff? We arrange round-trip flights from Abuja, 3 nights at a beach resort, airport transfers, a city tour, team dinner, and travel insurance — all itemized and confirmed before you commit. One invoice, one point of contact.",
  },
  "travel-consultancy": {
    included: [
      "Route planning and cost optimization (cheapest vs. fastest vs. most convenient routes)",
      "Entry requirements by destination (visa type, vaccination, passport validity)",
      "Travel insurance advice and policy recommendations",
      "Packing and documentation checklists",
      "Real-time advice by phone or WhatsApp during your trip",
    ],
    required:
      "Your destination(s), travel purpose (tourism, business, study, medical), approximate dates, your nationality and passport validity, any constraints (budget, time).",
    timeline:
      "Immediate consultancy for straightforward queries. For complex multi-country trips or business travel programs, we'll schedule a call or meeting to go through requirements in detail.",
    example:
      "Planning a multi-city trip but not sure which visa to apply for? We review your itinerary, tell you which country's embassy to approach, what documents are needed, and the optimal flight routing to minimize costs and layovers. Pay only for our time — no booking required.",
  },
};

// Document checklist for visa applicants
const visaChecklist = [
  "Valid passport with at least 6 months validity and blank pages",
  "Recent passport-size photos (white background, specific dimensions per destination)",
  "Completed visa application form (we assist with this)",
  "Bank statements (3-6 months, depending on destination)",
  "Employment letter or business registration documents",
  "Travel itinerary (flight bookings and hotel reservations)",
  "Invitation letter (if visiting friends, family, or business partners)",
  "Proof of ties to Nigeria (property ownership, family, job)",
  "Travel insurance certificate (for certain destinations)",
  "Marriage certificate, birth certificates (if traveling with family)",
  "Previous visa pages or travel history (if applicable)",
  "Vaccination certificates (yellow fever, COVID-19, others as required)",
];

function TravelPage() {
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [showChecklist, setShowChecklist] = useState(false);
  const { data: publishedServices } = useQuery({
    queryKey: ["website", "services", "travel"],
    queryFn: () => getPublishedServices("travel"),
    staleTime: 60_000,
  });
  const {
    data: publishedVisaDestinations,
    isLoading: visaDestinationsLoading,
    isError: visaDestinationsError,
  } = useQuery({
    queryKey: ["website", "visa-destinations"],
    queryFn: getPublishedVisaDestinations,
    staleTime: 60_000,
  });
  const visaDestinations = publishedVisaDestinations ?? [];
  const services = publishedServices ?? travelServices;

  const activeDestination = selectedDestination || visaDestinations[0]?.country;
  const destination = visaDestinations.find((d) => d.country === activeDestination);

  return (
    <>
      {/* Full-width Hero Banner */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt="Travel documents and passport"
          loading="eager"
          className="h-96 w-full object-cover lg:h-[28rem]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/95 via-primary-deep/85 to-primary-deep/70" />
        <div className="absolute inset-0 flex items-center">
          <div className="container-page">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
                Travel Division
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight text-primary-foreground sm:text-5xl lg:text-6xl">
                Travel Services
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-primary-foreground/85">
                Visas, flights, hotels and full itineraries handled end to end — from our office in
                Jimeta-Yola to wherever you are going.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visa Types We Process */}
      <section className="border-b border-border bg-background py-12 md:py-16">
        <div className="container-page">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">
              Visa Processing Services
            </h2>
            <p className="mt-3 text-muted-foreground">
              Expert guidance and application support for all visa categories
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Umrah Visas", icon: "🕌" },
              { name: "Study Visas", icon: "🎓" },
              { name: "Tourism Visas", icon: "✈️" },
              { name: "Hajj Visas", icon: "🕋" },
              { name: "Work Visas", icon: "💼" },
              { name: "Business Visas", icon: "🤝" },
              { name: "Transit Visas", icon: "🌍" },
            ].map((visa, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 text-center transition-all duration-300 hover:border-accent hover:shadow-lg hover:-translate-y-1"
              >
                <div className="text-4xl mb-3">{visa.icon}</div>
                <h3 className="font-bold text-primary group-hover:text-accent transition-colors">
                  {visa.name}
                </h3>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

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
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Clear, itemised costs before anything is booked
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Support by phone, WhatsApp and email while you travel
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Group and corporate arrangements welcome
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Interactive Visa Destination Checker */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-page max-w-4xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
              Visa destination quick reference
            </h2>
            <p className="mt-2 text-sm text-primary-foreground/75">
              Select a destination to see visa types, typical processing times, and key requirements
            </p>
          </div>

          {visaDestinationsLoading ? (
            <div aria-label="Loading visa destinations" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-xl border-2 border-primary-foreground/10 bg-primary-deep/70" />
              ))}
            </div>
          ) : visaDestinations.length > 0 ? <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visaDestinations.map((dest) => (
              <button
                key={dest.country}
                onClick={() => setSelectedDestination(dest.country)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  activeDestination === dest.country
                    ? "border-accent bg-accent-soft"
                    : "border-primary-foreground/20 bg-primary-deep hover:border-accent/50"
                }`}
              >
                <h3
                  className={`font-bold ${activeDestination === dest.country ? "text-accent-foreground" : "text-primary-foreground"}`}
                >
                  {dest.country}
                </h3>
                <p
                  className={`mt-1 text-xs ${activeDestination === dest.country ? "text-accent-foreground/80" : "text-primary-foreground/60"}`}
                >
                  {dest.processing_time}
                </p>
              </button>
            ))}
          </div>

          {destination && (
            <div className="mt-6 rounded-xl border border-primary-foreground/20 bg-primary-deep p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">
                    Visa Types
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary-foreground">
                    {destination.visa_types}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">
                    Processing Time
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary-foreground">
                    {destination.processing_time}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-primary-foreground/10 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">
                  Important Notes
                </p>
                <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
                  {destination.notes}
                </p>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-primary-foreground/75">
            Timelines are estimates and vary by individual circumstances.{" "}
            <a href="#inquiry-form" className="font-bold text-accent underline underline-offset-4">
              Contact us
            </a>{" "}
            for your specific case.
          </p>
          </> : (
            <p role={visaDestinationsError ? "alert" : undefined} className="mt-8 rounded-xl border border-primary-foreground/20 bg-primary-deep p-6 text-center text-sm text-primary-foreground/75">
              {visaDestinationsError
                ? "Visa destination information is temporarily unavailable. Please contact us for destination requirements."
                : "Visa destination information will be available soon. Please contact us for destination requirements."}
            </p>
          )}
        </div>
      </section>

      {/* Destination Carousel */}
      <section className="border-b border-border bg-background py-12 md:py-16">
        <div className="container-page">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">
              Explore Our Popular Destinations
            </h2>
            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
              Discover the countries we serve most frequently. From visa processing to complete
              travel packages, we handle all the details for your journey.
            </p>
          </div>
          <CountryCarousel />
        </div>
      </section>

      {/* Document Checklist for Visa Applicants */}
      <section className="border-y border-border bg-secondary/30 py-12 md:py-16">
        <div className="container-page max-w-3xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">
              Visa application document checklist
            </h2>
            <p className="mt-2 text-muted-foreground">
              General requirements for most visa applications — we provide a tailored checklist for
              your specific destination when you enquire
            </p>
          </div>

          <button
            onClick={() => setShowChecklist(!showChecklist)}
            className="mx-auto mt-6 flex items-center gap-2 rounded-md border-2 border-accent bg-accent-soft px-5 py-3 font-bold text-accent-foreground transition-opacity hover:opacity-90"
          >
            <FileText className="h-5 w-5" />
            {showChecklist ? "Hide" : "View"} Checklist
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showChecklist ? "rotate-180" : ""}`}
            />
          </button>

          {showChecklist && (
            <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-card">
              <ul className="space-y-3">
                {visaChecklist.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <span className="leading-relaxed text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-lg border border-accent/30 bg-accent-soft/50 p-4">
                <p className="text-sm leading-relaxed text-foreground/80">
                  <strong className="text-accent-foreground">Important:</strong> Requirements vary
                  by destination, visa type, and your circumstances. This is a general guide. When
                  you contact us, we provide a specific checklist for your application, review your
                  documents before submission, and flag anything that might cause delays or
                  rejections.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Detailed Services */}
      {services.map((service, i) => {
        const Icon = icons[service.slug] ?? Plane;
        const details = serviceDetails[service.slug as keyof typeof serviceDetails];

        // Special handling for tour packages - use card layout
        if (service.slug === "tour-packages") {
          return (
            <section
              key={service.slug}
              id={service.slug}
              className={`scroll-mt-24 py-14 sm:py-16 ${i % 2 === 1 ? "bg-secondary/50" : "bg-background"}`}
            >
              <div className="container-page">
                <TourPackagesCards />
              </div>
            </section>
          );
        }

        // Original layout for other services
        return (
          <section
            key={service.slug}
            id={service.slug}
            className={`scroll-mt-24 py-14 sm:py-16 ${i % 2 === 1 ? "bg-secondary/50" : "bg-background"}`}
          >
            <div className="container-page">
              <div className="grid gap-6 md:grid-cols-[auto_1fr] md:gap-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-soft">
                  <Icon className="h-7 w-7 text-accent-foreground" />
                </div>
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-bold text-primary sm:text-3xl">{service.title}</h2>
                  <p className="mt-2 font-semibold text-accent-foreground/80">{service.summary}</p>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{service.detail}</p>
                </div>
              </div>

              {details && (
                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      <h3 className="font-bold text-primary">What's included</h3>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {details.included.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-accent" />
                        <h3 className="text-sm font-bold text-primary">What you need to provide</h3>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {details.required}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-accent" />
                        <h3 className="text-sm font-bold text-primary">Typical timeline</h3>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {details.timeline}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {details?.example && (
                <div className="mt-6 rounded-xl border-2 border-accent/20 bg-accent-soft/30 p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent-foreground/70">
                    Example Scenario
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                    {details.example}
                  </p>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* Inquiry Form */}
      <section id="inquiry-form" className="scroll-mt-20 bg-primary-deep py-16">
        <div className="container-page max-w-3xl">
          <InquiryForm
            title="Travel enquiry"
            description="Tell us about your trip and we will come back with requirements and pricing."
            formType="travel"
            fields={[
              { name: "name", label: "Full name", required: true },
              { name: "phone", label: "Phone number", type: "tel", required: true },
              { name: "email", label: "Email address", type: "email" },
              {
                name: "service",
                label: "Service needed",
                type: "select",
                required: true,
                options: services.map((s) => s.title),
              },
              { name: "dates", label: "Travel dates", type: "date" },
              { name: "destination", label: "Destination" },
              {
                name: "message",
                label: "Message",
                type: "textarea",
                placeholder: "Any details we should know",
              },
            ]}
          />
        </div>
      </section>
    </>
  );
}
