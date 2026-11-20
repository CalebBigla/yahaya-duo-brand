import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Plane,
  Ship,
  ShieldCheck,
  Headphones,
  Workflow,
  Building2,
  Quote,
  ChevronDown,
  CheckCircle2,
  Globe,
  MapPin,
  Package,
  PackageSearch,
  Fuel,
  FileCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatedSection } from "@/components/ui/animated-section";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { LocalBusinessSchema } from "@/components/seo/LocalBusinessSchema";

// Hero - Oil & Gas / Industrial focus
import heroPetroleumImg from "@/assets/petroleum engineering.webp";
import heroOilRigImg from "@/assets/The Last Bow at Dusk.webp";

// Bento grid - Travel & Trade split
import bentoTravelCoupleImg from "@/assets/download (25).webp";
import bentoTravelLuggageImg from "@/assets/Minimalist Travel Aesthetic _ Manifesting My Next Journey 🌍✨.webp";
import bentoTradeLogisticsImg from "@/assets/Vietnam needs to nurture efficient logistics sector, adapt modern tech.webp";
import bentoTradeSupplyImg from "@/assets/Best Logistics Companies in India – Top Supply Chain Solutions for Business Growth 2026.webp";

// Trade gallery (mirroring hotel gallery)
import tradeOilGasImg from "@/assets/The Last Bow at Dusk.webp";
import tradeOffshoreImg from "@/assets/download (24).webp";
import tradeOnsiteImg from "@/assets/Off shore rig worker.webp";
import tradeTechnicalImg from "@/assets/petroleum engineering.webp";

// Hotel gallery
import hotel1Img from "@/assets/24 Small Guest Room Ideas for Compact Comfort and___.webp";
import hotel2Img from "@/assets/Borges 2129 I by depptö.webp";
import hotel3Img from "@/assets/Best Hotel Room in Jaipur.webp";
import hotel4Img from "@/assets/Akasha Beach Hotel.webp";

// Full-width banner
import fullWidthBannerImg from "@/assets/Import export training in karachi lahore islamabad pakistan.webp";

// Stats section lifestyle photo
import statsLifestyleImg from "@/assets/download (25).webp";

// Key features composite
import featuresPetroleumImg from "@/assets/petroleum engineering.webp";
import featuresLogisticsImg from "@/assets/Vietnam needs to nurture efficient logistics sector, adapt modern tech.webp";

// Trust section
import trustWorkerImg from "@/assets/Off shore rig worker.webp";

import { site } from "@/lib/site";
import {
  getFeaturedTestimonials,
  getPublishedFAQs,
  getPublishedHomepage,
  getPublishedSettings,
} from "@/lib/queries/website";

const title = "Travel Agency in Yola, Adamawa | Yahaya Travel & Trade Co Ltd";
const description =
  "Professional travel and trade services in Yola, Jimeta, Adamawa State. Visa processing, flight bookings, hotel reservations, tour packages, procurement, and import-export services. RC 9295358.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

/* Statistics reflecting actual company operations. */
const stats = [
  { value: "500+", label: "Clients served" },
  { value: "10+", label: "Countries" },
  { value: "5+", label: "Years in operation" },
  { value: "2", label: "Business divisions" },
];

const testimonials = [
  {
    division: "Travel",
    quote:
      "They handled my visa file from start to finish and told me exactly what to bring to the appointment. No guesswork, no wasted trips.",
    name: "Aisha Bello",
    role: "Yola",
  },
  {
    division: "Trade",
    quote:
      "We needed a supplier verified and the consignment moved within a tight window. The documentation was clean and delivery was on schedule.",
    name: "Ibrahim Musa",
    role: "Procurement lead",
  },
  {
    division: "Travel",
    quote:
      "Flights, hotel and transfers for a team of eight, all arranged in one conversation. Costs were itemised before we committed.",
    name: "Fatima Abdullahi",
    role: "Corporate client",
  },
];

const travelSteps = [
  {
    number: 1,
    title: "Tell us your destination",
    description:
      "Call, WhatsApp, or fill our form with your travel dates and visa type — tourist, business, medical, Hajj, Umrah, work, or study. We process visas for Saudi Arabia, Qatar, Turkey, UAE, China, Egypt and more.",
  },
  {
    number: 2,
    title: "We handle everything",
    description:
      "Complete travel package: visa application documentation, flight bookings with flexible fares, hotel reservations, airport transfers, market and tourist site connections. 50% deposit required on services.",
  },
  {
    number: 3,
    title: "You travel with confidence",
    description:
      "Receive your visa, confirmed tickets, and accommodation details with emergency travel assistance. Earn referral commission by connecting us with travelers — percentage paid after each transaction.",
  },
];

const tradeSteps = [
  {
    number: 1,
    title: "Share your requirement",
    description:
      "Tell us what products you need, target quantities, and delivery location. We identify manufacturers in China, Egypt, or Saudi Arabia offering the best prices for your specification.",
  },
  {
    number: 2,
    title: "We source and negotiate",
    description:
      "We verify suppliers, negotiate transparent pricing, and place orders directly. First order requires 50% deposit; oil & gas deals require 60% initial deposit. We handle all documentation.",
  },
  {
    number: 3,
    title: "Delivery and support",
    description:
      "Complete logistics coordination — shipping, customs clearing, and delivery to your location. Referral commission program available for clients who connect us with new business.",
  },
];

const faqs = [
  {
    question: "What visa types do you process?",
    answer:
      "We process Tourist Visas, Business Visas, Medical Visas, Transit Visas, Hajj Visas, Umrah Visas, Work Visas, and Study Visas. Destination countries include Saudi Arabia, Qatar, Turkey, United Arab Emirates, China, Egypt and others. Contact us with your specific destination for processing timelines and document requirements.",
  },
  {
    question: "How do your trade deposits work?",
    answer:
      "For general sourcing and procurement, we require 50% deposit on the first order to initiate the procurement process. For oil and gas deals (buying, selling, supplying petroleum products), we require 60% initial deposit. Subsequent orders may have different payment terms based on established business relationship. All deposits are applied toward the total cost with transparent itemized invoicing.",
  },
  {
    question: "Do you source products internationally?",
    answer:
      "Yes. We source new products directly from manufacturers in China, Egypt, and Saudi Arabia at the lowest prices based on your order specifications. We handle supplier identification, price negotiation, order placement, shipping coordination, customs clearing, and delivery to your location in Nigeria. This includes building materials, equipment, consumables, and goods across sectors.",
  },
  {
    question: "What's included in your travel packages?",
    answer:
      "Complete travel packages include: visa application support and documentation, airline ticket bookings (local and international with flexible fare options), hotel reservations, airport pick-up and drop-off, connections to affordable markets, hospitals, tourist attractions, and historical sites. We can arrange partial or complete packages depending on your needs. 50% deposit required to secure bookings.",
  },
  {
    question: "How does your referral commission program work?",
    answer:
      "If you refer people to us for either travel or trade services, you earn a percentage commission after each completed transaction. Contact us directly to enroll in the referral program and get details on commission structure and payment terms. This applies to both travel bookings and trade deals.",
  },
  {
    question: "Can you handle oil and gas investment deals?",
    answer:
      "Yes. Our oil and gas operations include buying, selling, supplying, and shipping petroleum products. We can order directly from refineries and handle complete logistics. Investment opportunities are available with 60% initial deposit. Contact us to discuss specific deal structures, volumes, and partnership terms.",
  },
];

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Security & Compliance",
    body: "Registered Nigerian company (RC 9295358) with verifiable credentials and contract-ready documentation for both travel and trade operations.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    body: "Multi-channel accessibility — phone, WhatsApp, email — with real people who know your file and respond within 24 hours.",
  },
  {
    icon: Workflow,
    title: "Transparent Documentation",
    body: "Every transaction backed by clear paperwork: visa checklists, flight confirmations, purchase orders, delivery notes. Nothing left to memory.",
  },
  {
    icon: Building2,
    title: "Verified Partnerships",
    body: "Vetted hotels, airlines, suppliers, and freight forwarders. We verify counterparties before you commit, reducing risk on both sides.",
  },
];

const featuredHotels = [
  {
    image: hotel1Img,
    title: "Comfort Stays",
    description: "Cozy accommodations for budget-conscious travelers",
  },
  {
    image: hotel2Img,
    title: "Business Suites",
    description: "Professional environments for corporate travelers",
  },
  {
    image: hotel3Img,
    title: "Premium Rooms",
    description: "Luxury options for discerning guests",
  },
  {
    image: hotel4Img,
    title: "Beachfront Escapes",
    description: "Seaside getaways and resort destinations",
  },
];

const tradeGallery = [
  {
    image: tradeOilGasImg,
    title: "Oil & Gas Trade",
    description: "Petroleum products and energy sector brokerage",
  },
  {
    image: tradeOffshoreImg,
    title: "Offshore Operations",
    description: "Marine logistics and offshore supply coordination",
  },
  {
    image: tradeOnsiteImg,
    title: "On-Site Expertise",
    description: "Field operations and technical procurement support",
  },
  {
    image: tradeTechnicalImg,
    title: "Technical Sourcing",
    description: "Specialized equipment and technical supplies",
  },
];

const categoryCards = [
  {
    image: bentoTravelCoupleImg,
    title: "Travel Services",
    subtitle: "Visas & Flights",
    link: "/travel" as const,
    hash: undefined,
  },
  {
    image: bentoTradeLogisticsImg,
    title: "Import/Export",
    subtitle: "Logistics & Trade",
    link: "/trade" as const,
    hash: undefined,
  },
  {
    image: tradeOilGasImg,
    title: "Oil & Gas",
    subtitle: "Energy Trading",
    link: "/trade" as const,
    hash: "oil-and-gas-trade",
  },
  {
    image: bentoTradeSupplyImg,
    title: "Supply Chain",
    subtitle: "Sourcing & Procurement",
    link: "/trade" as const,
    hash: "sourcing-procurement",
  },
];

/* "What we deliver" cards. Same wording as before, now always visible. */
const deliverCards = [
  {
    icon: Plane,
    tag: "Complete Travel Services",
    title: "Travel",
    body: "Complete visa processing, flight bookings, hotel reservations, and tour packages to Saudi Arabia, Qatar, Turkey, UAE, China, Egypt and more.",
    listTitle: "What we offer",
    items: ["All visa types processing", "Flight bookings & reservations", "Hotel accommodations", "Airport transfers & tours"],
    note: null,
    link: "/travel" as const,
    hash: undefined,
  },
  {
    icon: PackageSearch,
    tag: "International Sourcing",
    title: "Sourcing & Procurement",
    body: "Direct sourcing of new products from our international partners at lowest prices. We find suppliers, verify credentials, and manage complete delivery.",
    listTitle: "Our process",
    items: ["Supplier identification & verification", "Price negotiation & ordering", "Complete logistics handling", "50% deposit on first order"],
    note: null,
    link: "/trade" as const,
    hash: "sourcing-procurement",
  },
  {
    icon: Users,
    tag: "Expert Advisory",
    title: "Consultation & Referrals",
    body: "Trade and travel consultation services plus referral commission opportunities for connecting us with new clients.",
    listTitle: "Advisory services",
    items: ["Trade operations and logistics guidance", "Documentation and compliance support", "Personalized travel planning"],
    note: {
      title: "Referral program",
      body: "Earn commission when you refer clients to us. Paid after each completed transaction.",
    },
    link: "/quote" as const,
    hash: undefined,
  },
];

function Index() {
  const [activeJourney, setActiveJourney] = useState<"travel" | "trade">("trade");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { data: homepage } = useQuery({
    queryKey: ["website", "homepage"],
    queryFn: getPublishedHomepage,
    staleTime: 60_000,
  });
  const { data: settings } = useQuery({
    queryKey: ["website", "settings"],
    queryFn: getPublishedSettings,
    staleTime: 60_000,
  });
  const { data: publishedTestimonials } = useQuery({
    queryKey: ["website", "testimonials", "featured"],
    queryFn: getFeaturedTestimonials,
    staleTime: 60_000,
  });
  const { data: publishedFaqs } = useQuery({
    queryKey: ["website", "faqs"],
    queryFn: getPublishedFAQs,
    staleTime: 60_000,
  });

  const displayStats = homepage
    ? [
        { value: `${homepage.stats_clients_served ?? 500}+`, label: "Clients served" },
        { value: `${homepage.stats_destinations ?? 10}+`, label: "Countries" },
        { value: `${homepage.stats_years_experience ?? 5}+`, label: "Years in operation" },
        { value: "2", label: "Business divisions" },
      ]
    : stats;
  const displayTestimonials = publishedTestimonials?.length
    ? publishedTestimonials.map((testimonial) => ({
        division:
          testimonial.service_division === "both"
            ? "Travel & Trade"
            : testimonial.service_division
              ? testimonial.service_division.charAt(0).toUpperCase() +
                testimonial.service_division.slice(1)
              : "Client",
        quote: testimonial.testimonial,
        name: testimonial.client_name,
        role: testimonial.client_title ?? "",
      }))
    : testimonials;
  const displayFaqs = publishedFaqs?.length
    ? publishedFaqs.map((faq) => ({ question: faq.question, answer: faq.answer }))
    : faqs;
  const companyRegistration = settings?.rc_number ?? site.rcNumber;

  const steps = activeJourney === "travel" ? travelSteps : tradeSteps;

  return (
    <>
      {/* Hero with Floating Collage */}
      <section className="gradient-mesh noise-texture relative isolate overflow-hidden bg-primary-deep py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-deep via-primary to-primary-deep/90" />

        <div className="container-page relative z-10">
          <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:items-center xl:gap-16">
            <div>
              <p className="eyebrow eyebrow-on-dark animate-fade-up stagger-1">
                RC {companyRegistration} · Jimeta-Yola, Adamawa
              </p>
              <h1 className="animate-fade-up stagger-2 mt-5 text-[2.25rem] font-bold leading-[1.08] tracking-[-0.03em] text-primary-foreground sm:text-5xl lg:text-[3.5rem]">
                {homepage?.hero_title ?? "Your Trusted Partner in Travel and Trade"}
              </h1>
              <p className="animate-fade-up stagger-3 mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/75 sm:text-[1.0625rem]">
                {homepage?.hero_subtitle ??
                  "We operate at the intersection of travel management, international consultancy, and global trade facilitation, offering a comprehensive suite of services that include visa processing, flight bookings, tour packages, hotel reservations, travel advisory, trade consultancy, general trading, oil & gas commodity supply, wholesale import and export, as well as sourcing and procurement services."}
              </p>
              <div className="animate-fade-up stagger-4 mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/travel"
                  className="btn-interactive group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground"
                >
                  <Plane className="h-4 w-4" /> Travel <ArrowRight className="arrow-nudge h-4 w-4" />
                </Link>
                <Link
                  to="/trade"
                  className="btn-interactive group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/5 px-6 text-sm font-semibold text-primary-foreground hover:border-accent hover:bg-primary-foreground/10"
                >
                  <Ship className="h-4 w-4" /> Trade <ArrowRight className="arrow-nudge h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Floating Collage - Travel & Trade Focus.
                Desktop only, so lazy: phones and tablets never download these photos. */}
            <div className="relative hidden lg:block">
              <div className="animate-settle stagger-2 relative">
                <img
                  src={bentoTravelLuggageImg}
                  alt="Travel services"
                  loading="lazy"
                  decoding="async"
                  className="h-80 w-full rounded-3xl object-cover shadow-elevated"
                />
              </div>
              <div className="animate-settle stagger-4 absolute -bottom-8 -left-12 w-64 rounded-2xl ring-4 ring-primary-deep">
                <img
                  src={bentoTradeLogisticsImg}
                  alt="Trade and logistics"
                  loading="lazy"
                  decoding="async"
                  className="h-56 w-full rounded-2xl object-cover shadow-elevated"
                />
              </div>
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />
              <div className="absolute -bottom-12 left-0 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Core Objectives - Two Large Featured Cards */}
      <section className="section-y">
        <div className="container-page">
          <AnimatedSection animation="fade-up">
            <div className="text-center">
              <h2 className="heading-section text-primary">
                Core business divisions
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Travel and Tour, sourcing and Procurement — Two pillars of our business
              </p>
            </div>
          </AnimatedSection>

          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2 lg:gap-6">
            <AnimatedSection animation="scale" delay={0} className="h-full">
              <Link
                to="/travel"
                className="card-interactive group relative block h-full overflow-hidden rounded-2xl ring-1 ring-black/5 sm:rounded-3xl"
              >
                {/* Text sits in the normal flow: the card keeps its 3:4 shape but grows
                    if the text needs more room, so nothing can spill out on tablets. */}
                <div className="relative flex h-full aspect-[4/5] flex-col justify-end sm:aspect-[16/11] md:aspect-[4/5] lg:aspect-[5/6]">
                  <img
                    src={bentoTravelLuggageImg}
                    alt="Travel and tour services"
                    loading="lazy"
                    className="img-zoom absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-deep via-primary-deep/70 to-transparent" />
                  <div className="relative p-5 text-primary-foreground sm:p-7 md:p-6 lg:p-8 xl:p-10">
                    <Plane className="h-8 w-8 text-accent lg:h-9 lg:w-9" strokeWidth={1.5} />
                    <h3 className="mt-3 text-2xl font-bold leading-tight text-balance sm:text-3xl md:text-2xl lg:mt-4 lg:text-3xl">
                      Travel and Tour
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-primary-foreground/85 sm:text-base md:text-sm lg:text-base">
                      Complete visa processing, flight bookings, hotel reservations, and tour
                      packages to Saudi Arabia, Qatar, Turkey, UAE, China, Egypt
                      and more.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent lg:mt-6 lg:text-base">
                      Learn more <ArrowRight className="arrow-nudge h-4 w-4 lg:h-5 lg:w-5" />
                    </div>
                  </div>
                </div>
              </Link>
            </AnimatedSection>

            <AnimatedSection animation="scale" delay={100} className="h-full">
              <Link
                to="/trade"
                hash="sourcing-procurement"
                className="card-interactive group relative block h-full overflow-hidden rounded-2xl ring-1 ring-black/5 sm:rounded-3xl"
              >
                {/* Text sits in the normal flow: the card keeps its 3:4 shape but grows
                    if the text needs more room, so nothing can spill out on tablets. */}
                <div className="relative flex h-full aspect-[4/5] flex-col justify-end sm:aspect-[16/11] md:aspect-[4/5] lg:aspect-[5/6]">
                  <img
                    src={bentoTradeSupplyImg}
                    alt="Sourcing and procurement services"
                    loading="lazy"
                    className="img-zoom absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-deep via-primary-deep/70 to-transparent" />
                  <div className="relative p-5 text-primary-foreground sm:p-7 md:p-6 lg:p-8 xl:p-10">
                    <PackageSearch className="h-8 w-8 text-accent lg:h-9 lg:w-9" strokeWidth={1.5} />
                    <h3 className="mt-3 text-2xl font-bold leading-tight text-balance sm:text-3xl md:text-2xl lg:mt-4 lg:text-3xl">
                      Sourcing and Procurement
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-primary-foreground/85 sm:text-base md:text-sm lg:text-base">
                      Direct international sourcing from trusted global suppliers — competitive
                      pricing, verified credentials, complete delivery management.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent lg:mt-6 lg:text-base">
                      Learn more <ArrowRight className="arrow-nudge h-4 w-4 lg:h-5 lg:w-5" />
                    </div>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Travels & Tours - Compact Section */}
      <section className="border-y border-border bg-secondary/40 section-y">
        <div className="container-page">
          <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <AnimatedSection animation="fade-up">
              <div>
                <span className="eyebrow">
                  Supporting Service
                </span>
                <h2 className="mt-4 heading-section text-primary">
                  Travels & Tours
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Complete visa processing and travel packages for tourist, business, medical, Hajj,
                  Umrah, work, and study visas to Saudi Arabia, Qatar, Turkey, UAE, China,
                  Egypt and more. Flight bookings, hotel reservations, airport transfers,
                  and guided tours.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent-ink" />
                    <span>Multiple Visa Types</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent-ink" />
                    <span>Complete Travel Packages</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent-ink" />
                    <span>Referral Commission Program</span>
                  </div>
                </div>
                <Link
                  to="/travel"
                  className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                >
                  <span className="link-underline">View travel services</span> <ArrowRight className="arrow-nudge h-4 w-4" />
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="scale" delay={100}>
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={bentoTravelCoupleImg}
                  alt="Travel services"
                  loading="lazy"
                  className="h-60 w-full object-cover md:h-72"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Sourcing & Procurement Highlight */}
      <section className="section-y">
        <div className="container-page">
          <div className="grid gap-12 md:grid-cols-2 md:gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <AnimatedSection animation="fade-up">
              <div>
                <span className="eyebrow">
                  Procurement Excellence
                </span>
                <h2 className="mt-4 heading-section text-primary">
                  Direct sourcing and international procurement
                </h2>
                <p className="mt-5 text-muted-foreground leading-relaxed">
                  We source new products directly from manufacturers in China, Egypt, and Saudi
                  Arabia at the lowest prices. Complete order handling from supplier verification to
                  delivery at your location.
                </p>

                <div className="relative mt-8 space-y-6 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-border">
                  <div className="flex gap-4">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent bg-background font-display text-sm font-semibold text-primary">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Product Identification & Sourcing</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Tell us what you need. We identify manufacturers in China, Egypt, and Saudi
                        Arabia offering the best prices based on your order specifications
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent bg-background font-display text-sm font-semibold text-primary">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">
                        Price Negotiation & Order Placement
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        We negotiate transparent pricing and place orders directly with verified
                        suppliers. 50% deposit required on first order to initiate procurement
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent bg-background font-display text-sm font-semibold text-primary">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Shipping & Delivery Coordination</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Complete logistics handling — freight coordination, customs clearing, and
                        delivery to your specified location with full documentation
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  to="/trade"
                  hash="sourcing-procurement"
                  className="btn-interactive group mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-deep"
                >
                  View Full Procurement Services <ArrowRight className="arrow-nudge h-4 w-4" />
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="scale" delay={200}>
              <div className="relative">
                <img
                  src={bentoTradeLogisticsImg}
                  alt="Supply chain operations"
                  loading="lazy"
                  className="h-full min-h-[280px] w-full rounded-3xl object-cover shadow-elevated md:min-h-[380px] lg:min-h-[440px]"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Premium Services: details always visible (hover-only content fails on touch and keyboard). */}
      <section className="section-y !pt-0">
        <div className="container-page">
          <AnimatedSection animation="fade-up">
            <div className="text-center">
              <span className="eyebrow">Premium Services</span>
              <h2 className="mt-4 heading-section text-primary">What we deliver</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Three ways we work with you, from first enquiry to final delivery
              </p>
            </div>
          </AnimatedSection>

          <div className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3 lg:gap-5">
            {deliverCards.map((card, i) => (
              <AnimatedSection key={card.title} animation="fade-up" delay={i * 90} className="h-full">
                <div className="card-interactive group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card lg:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <span className="icon-tile">
                      <card.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-primary">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                  <div className="mt-5 border-t border-border pt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{card.listTitle}</h4>
                    <ul className="mt-3 space-y-2">
                      {card.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-foreground/85">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" strokeWidth={1.75} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {card.note && (
                      <p className="mt-4 rounded-xl bg-secondary px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-primary">{card.note.title}. </span>
                        {card.note.body}
                      </p>
                    )}
                  </div>
                  <Link
                    to={card.link}
                    {...(card.hash ? { hash: card.hash } : {})}
                    className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-primary"
                  >
                    <span className="link-underline">Learn more</span>
                    <ArrowRight className="arrow-nudge h-4 w-4" />
                  </Link>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Full-Width Banner - Energy & Supply Chain */}
      <section className="relative isolate overflow-hidden">
        <img
          src={fullWidthBannerImg}
          alt="Global logistics"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/95 via-primary-deep/80 to-transparent" />
        <div className="relative z-10 py-16 sm:py-20 lg:py-24">
          <div className="container-page">
            <AnimatedSection animation="fade-up">
              <div className="max-w-2xl">
                <h2 className="heading-section text-primary-foreground">
                  One partner for trade and travel
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80 sm:mt-4 sm:text-base md:mt-5 md:text-lg">
                  From sourcing products internationally to arranging complete travel packages — we
                  manage logistics, documentation, and coordination. Oil & gas trading with refinery
                  connections, import/export with full clearing, and visa processing with
                  appointment booking all under one roof.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4">
                  <Link
                    to="/quote"
                    className="btn-interactive group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground sm:w-auto"
                  >
                    Request a Quote <ArrowRight className="arrow-nudge h-4 w-4" />
                  </Link>
                  <Link
                    to="/about"
                    className="btn-interactive inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/5 px-6 text-sm font-semibold text-primary-foreground hover:border-accent hover:bg-primary-foreground/10 sm:w-auto"
                  >
                    Learn Our Story
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Stats Section - Business Scale */}
      <section className="gradient-mesh section-y">
        <div className="container-page">
          <div className="grid gap-12 md:grid-cols-2 md:gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <AnimatedSection animation="fade-up">
              <div>
                <h2 className="heading-section text-primary">
                  Five years of trusted service
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Since 2020, we've been processing visas, arranging travel, sourcing products from
                  China, Egypt, and Saudi Arabia, and facilitating oil & gas trade. Our clients
                  trust us with their travel plans and their business deals.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
                  {displayStats.map((stat, i) => (
                    <div
                      key={stat.label}
                      className="card-interactive relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-accent sm:p-6"
                    >
                      <p className="font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                        {stat.value}
                      </p>
                      <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="scale" delay={200}>
              <div className="relative">
                <img
                  src={bentoTravelCoupleImg}
                  alt="Travel and business services"
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-3xl object-cover object-top shadow-elevated lg:aspect-[5/4]"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How It Works - Interactive Journey */}
      <section className="border-y border-border bg-secondary/30 section-y">
        <div className="container-page">
          <div className="text-center">
            <h2 className="heading-section text-primary">How it works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              From first contact to completion — here's what to expect
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="inline-flex gap-1 rounded-full border border-border bg-card p-1 shadow-card" role="group" aria-label="Choose a journey">
              <button
                type="button"
                aria-pressed={activeJourney === "trade"}
                onClick={() => setActiveJourney("trade")}
                className={`flex min-h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-[background-color,color,box-shadow] duration-300 ${
                  activeJourney === "trade"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Ship className="h-4 w-4" /> Trade Journey
              </button>
              <button
                type="button"
                aria-pressed={activeJourney === "travel"}
                onClick={() => setActiveJourney("travel")}
                className={`flex min-h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-[background-color,color,box-shadow] duration-300 ${
                  activeJourney === "travel"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Plane className="h-4 w-4" /> Travel Journey
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-5">
            {steps.map((step) => (
              <div
                key={`${activeJourney}-${step.number}`}
                className="animate-fade-up"
                style={{ animationDelay: `${(step.number - 1) * 80}ms` }}
              >
                <div className="card-interactive flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-sm font-semibold text-accent">
                      {String(step.number).padStart(2, "0")}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Step {step.number} of 3
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-primary">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features with Composite Images */}
      <section className="section-y">
        <div className="container-page">
          <div className="grid gap-12 md:grid-cols-2 md:gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h2 className="heading-section text-primary">
                Why businesses trust our supply chain
              </h2>
              <div className="mt-8 space-y-6">
                <div className="group flex gap-4">
                  <span className="icon-tile !h-9 !w-9 shrink-0 !rounded-lg">
                    <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-primary">Documentation discipline</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Purchase orders, delivery notes, quality certificates, customs clearance —
                      every transaction tracked and documented from quote to delivery.
                    </p>
                  </div>
                </div>
                <div className="group flex gap-4">
                  <span className="icon-tile !h-9 !w-9 shrink-0 !rounded-lg">
                    <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-primary">Logistics coordination</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Multi-vendor procurement with freight, clearing, and delivery requires project
                      management. We coordinate timelines, manage dependencies, and keep you
                      informed.
                    </p>
                  </div>
                </div>
                <div className="group flex gap-4">
                  <span className="icon-tile !h-9 !w-9 shrink-0 !rounded-lg">
                    <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-primary">Supplier verification</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We vet suppliers and freight forwarders — checking references, confirming
                      terms in writing, and ensuring they can deliver to spec before you commit.
                    </p>
                  </div>
                </div>
                <div className="group flex gap-4">
                  <span className="icon-tile !h-9 !w-9 shrink-0 !rounded-lg">
                    <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-primary">One accountable relationship</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Corporate clients often need both procurement and travel services for the same
                      project. Managing both through one vendor simplifies coordination and
                      accountability.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <AnimatedSection animation="scale" delay={200}>
              <div className="relative">
                <img
                  src={featuresPetroleumImg}
                  alt="Trade operations"
                  loading="lazy"
                  className="h-80 w-full rounded-3xl object-cover shadow-elevated md:h-96"
                />
                <img
                  src={featuresLogisticsImg}
                  alt="Logistics network"
                  loading="lazy"
                  className="absolute -bottom-6 -left-6 h-40 w-56 rounded-2xl object-cover shadow-elevated md:-bottom-8 md:-left-8 md:h-48 md:w-64"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Trust Section with Worker Photo */}
      <section className="border-y border-border bg-primary section-y text-primary-foreground">
        <div className="container-page">
          <div className="grid gap-12 md:grid-cols-2 md:gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <AnimatedSection animation="scale" delay={0}>
              <div className="relative">
                <img
                  src={trustWorkerImg}
                  alt="Field operations"
                  loading="lazy"
                  className="h-full min-h-[260px] w-full rounded-3xl object-cover shadow-elevated md:min-h-[360px]"
                />
              </div>
            </AnimatedSection>

            <div>
              <h2 className="heading-section">Why clients keep coming back</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {trustPoints.map((point) => (
                  <div
                    key={point.title}
                    className="group rounded-2xl border border-primary-foreground/10 bg-primary-deep/70 p-6 transition-[border-color,transform,background-color] duration-300 hover:-translate-y-1 hover:border-accent/40 hover:bg-primary-deep"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                      <point.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-4 font-semibold">{point.title}</h3>
                    <p className="mt-2 text-sm text-primary-foreground/75">{point.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore by Category Strip */}
      <section className="section-y">
        <div className="container-page">
          <AnimatedSection animation="fade-up">
            <h2 className="text-center heading-section text-primary">
              Explore our services
            </h2>
          </AnimatedSection>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {/* Oil & Gas */}
            <AnimatedSection animation="scale" delay={0}>
              <Link
                to="/trade"
                hash="oil-and-gas-trade"
                className="card-interactive group block overflow-hidden rounded-2xl border border-border bg-card shadow-card"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={tradeOilGasImg}
                    alt="Oil & Gas"
                    loading="lazy"
                    className="img-zoom h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-deep via-primary-deep/60 to-primary-deep/5" />
                  <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">
                      Energy Trading
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">Oil & Gas</h3>
                  </div>
                </div>
              </Link>
            </AnimatedSection>

            {/* Sourcing & Procurement */}
            <AnimatedSection animation="scale" delay={100}>
              <Link
                to="/trade"
                hash="sourcing-procurement"
                className="card-interactive group block overflow-hidden rounded-2xl border border-border bg-card shadow-card"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={bentoTradeSupplyImg}
                    alt="Sourcing & Procurement"
                    loading="lazy"
                    className="img-zoom h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-deep via-primary-deep/60 to-primary-deep/5" />
                  <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">
                      Supply Chain
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">Sourcing & Procurement</h3>
                  </div>
                </div>
              </Link>
            </AnimatedSection>

            {/* Import/Export */}
            <AnimatedSection animation="scale" delay={200}>
              <Link
                to="/trade"
                hash="import-export"
                className="card-interactive group block overflow-hidden rounded-2xl border border-border bg-card shadow-card"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={bentoTradeLogisticsImg}
                    alt="Import/Export"
                    loading="lazy"
                    className="img-zoom h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-deep via-primary-deep/60 to-primary-deep/5" />
                  <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">
                      Logistics & Trade
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">Import/Export</h3>
                  </div>
                </div>
              </Link>
            </AnimatedSection>

            {/* Travel Services */}
            <AnimatedSection animation="scale" delay={300}>
              <Link
                to="/travel"
                className="card-interactive group block overflow-hidden rounded-2xl border border-border bg-card shadow-card"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={bentoTravelCoupleImg}
                    alt="Travel Services"
                    loading="lazy"
                    className="img-zoom h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-deep via-primary-deep/60 to-primary-deep/5" />
                  <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">
                      Visas & Flights
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">Travel Services</h3>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border bg-secondary/50 section-y">
        <div className="container-page">
          <AnimatedSection animation="fade-up">
            <h2 className="heading-section text-primary">What clients say</h2>
          </AnimatedSection>

          <div className="mt-10 grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {displayTestimonials.map((t, i) => (
              <AnimatedSection
                key={i}
                animation={i % 2 === 0 ? "slide-left" : "slide-right"}
                delay={i * 100}
                className="h-full"
              >
                <figure className="card-interactive flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <Quote className="h-6 w-6 text-accent" strokeWidth={1.5} aria-hidden="true" />
                    <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                      {t.division}
                    </span>
                  </div>
                  <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-foreground/85">
                    "{t.quote}"
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4 text-sm">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xs font-semibold text-accent"
                    >
                      {t.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span>
                      <span className="block font-semibold text-primary">{t.name}</span>
                      <span className="block text-xs text-muted-foreground">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-y">
        <div className="container-page max-w-3xl">
          <div className="text-center">
            <h2 className="heading-section text-primary">Common questions</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Quick answers to questions we hear most often
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {displayFaqs.map((faq, index) => (
              <div
                key={index}
                className={`overflow-hidden rounded-2xl border bg-card transition-[border-color,box-shadow] duration-300 ${openFaq === index ? "border-accent/60 shadow-card" : "border-border hover:border-primary/25"}`}
              >
                <button
                  type="button"
                  aria-expanded={openFaq === index}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="group flex min-h-16 w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-semibold leading-snug text-primary">{faq.question}</span>
                  <ChevronDown
                    className={`h-8 w-8 shrink-0 rounded-full p-1.5 transition-[transform,background-color,color] duration-300 ${
                      openFaq === index ? "rotate-180 bg-primary text-accent" : "bg-secondary text-primary group-hover:bg-accent-soft"
                    }`}
                  />
                </button>
                {/* Grid-row trick: animates to the answer's natural height. */}
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    openFaq === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                  inert={openFaq !== index}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't see your question?{" "}
            <Link
              to="/contact"
              className="font-semibold text-primary underline decoration-accent decoration-2 underline-offset-4 transition-colors hover:decoration-primary"
            >
              Contact us
            </Link>{" "}
            and we'll give you a specific answer.
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="gradient-mesh bg-primary-deep section-y">
        <div className="container-page relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="heading-section text-primary-foreground">
              Ready to get started?
            </h2>
            <p className="mt-3 max-w-xl text-primary-foreground/75">
              Whether you need international sourcing, oil & gas trading, or complete travel
              packages — send us your requirements. We offer trade and travel consultation plus
              referral commission opportunities.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/quote"
              className="btn-interactive group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground"
            >
              Get a Quote <ArrowRight className="arrow-nudge h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="btn-interactive inline-flex min-h-12 items-center justify-center rounded-full border border-primary-foreground/30 bg-primary-foreground/5 px-6 text-sm font-semibold text-primary-foreground hover:border-accent hover:bg-primary-foreground/10"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      {/* Structured Data for Local SEO */}
      <LocalBusinessSchema />
    </>
  );
}
