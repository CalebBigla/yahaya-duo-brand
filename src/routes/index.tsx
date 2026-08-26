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
import { AnimatedSection } from "@/components/ui/animated-section";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// Hero - Oil & Gas / Industrial focus
import heroPetroleumImg from "@/assets/petroleum engineering.jpg";
import heroOilRigImg from "@/assets/The Last Bow at Dusk.jpg";

// Bento grid - Travel & Trade split
import bentoTravelCoupleImg from "@/assets/download (25).jpg";
import bentoTravelLuggageImg from "@/assets/Minimalist Travel Aesthetic _ Manifesting My Next Journey 🌍✨.jpg";
import bentoTradeLogisticsImg from "@/assets/Vietnam needs to nurture efficient logistics sector, adapt modern tech.jpg";
import bentoTradeSupplyImg from "@/assets/Best Logistics Companies in India – Top Supply Chain Solutions for Business Growth 2026.jpg";

// Trade gallery (mirroring hotel gallery)
import tradeOilGasImg from "@/assets/The Last Bow at Dusk.jpg";
import tradeOffshoreImg from "@/assets/download (24).jpg";
import tradeOnsiteImg from "@/assets/Off shore rig worker.jpg";
import tradeTechnicalImg from "@/assets/petroleum engineering.jpg";

// Hotel gallery
import hotel1Img from "@/assets/24 Small Guest Room Ideas for Compact Comfort and___.jpg";
import hotel2Img from "@/assets/Borges 2129 I by depptö.jpg";
import hotel3Img from "@/assets/Best Hotel Room in Jaipur.jpg";
import hotel4Img from "@/assets/Akasha Beach Hotel.jpg";

// Full-width banner
import fullWidthBannerImg from "@/assets/Import export training in karachi lahore islamabad pakistan.jpg";

// Stats section lifestyle photo
import statsLifestyleImg from "@/assets/download (25).jpg";

// Key features composite
import featuresPetroleumImg from "@/assets/petroleum engineering.jpg";
import featuresLogisticsImg from "@/assets/Vietnam needs to nurture efficient logistics sector, adapt modern tech.jpg";

// Trust section
import trustWorkerImg from "@/assets/Off shore rig worker.jpg";

import { site, travelServices, tradeServices } from "@/lib/site";

const title = "Yahaya Travel and Trade Co Ltd | Oil & Gas, Sourcing & Procurement Services";
const description =
  "Oil and gas trade, filling stations, sourcing and procurement services. Import/export logistics and travel services. Registered Nigerian company RC 9295358 in Jimeta-Yola, Adamawa.";

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

/* PLACEHOLDER DATA — replace with real figures before launch. */
const stats = [
  { value: "500+", label: "Clients served" },
  { value: "20+", label: "Destinations covered" },
  { value: "5+", label: "Years in operation" },
  { value: "3", label: "Support channels" },
];

const testimonials = [
  {
    division: "Travel",
    quote:
      "They handled my visa file from start to finish and told me exactly what to bring to the appointment. No guesswork, no wasted trips.",
    name: "Client name",
    role: "Yola",
  },
  {
    division: "Trade",
    quote:
      "We needed a supplier verified and the consignment moved within a tight window. The documentation was clean and delivery was on schedule.",
    name: "Client name",
    role: "Procurement lead",
  },
  {
    division: "Travel",
    quote:
      "Flights, hotel and transfers for a team of eight, all arranged in one conversation. Costs were itemised before we committed.",
    name: "Client name",
    role: "Corporate client",
  },
];

const travelSteps = [
  {
    number: 1,
    title: "Tell us your destination",
    description: "Call, WhatsApp, or fill our form with your travel dates and visa type — tourist, business, medical, Hajj, Umrah, work, or study. We process visas for Germany, Saudi Arabia, Qatar, Turkey, UAE, China, Egypt, Cyprus and more.",
  },
  {
    number: 2,
    title: "We handle everything",
    description: "Complete travel package: visa application documentation, flight bookings with flexible fares, hotel reservations, airport transfers, market and tourist site connections. 50% deposit required on services.",
  },
  {
    number: 3,
    title: "You travel with confidence",
    description: "Receive your visa, confirmed tickets, and accommodation details with emergency travel assistance. Earn referral commission by connecting us with travelers — percentage paid after each transaction.",
  },
];

const tradeSteps = [
  {
    number: 1,
    title: "Share your requirement",
    description: "Tell us what products you need, target quantities, and delivery location. We identify manufacturers in China, Egypt, or Saudi Arabia offering the best prices for your specification.",
  },
  {
    number: 2,
    title: "We source and negotiate",
    description: "We verify suppliers, negotiate transparent pricing, and place orders directly. First order requires 50% deposit; oil & gas deals require 60% initial deposit. We handle all documentation.",
  },
  {
    number: 3,
    title: "Delivery and support",
    description: "Complete logistics coordination — shipping, customs clearing, and delivery to your location. Referral commission program available for clients who connect us with new business.",
  },
];

const faqs = [
  {
    question: "What visa types do you process?",
    answer: "We process Tourist Visas, Business Visas, Medical Visas, Transit Visas, Hajj Visas, Umrah Visas, Work Visas, and Study Visas. We also handle Schengen Visas. Destination countries include Germany, Saudi Arabia, Qatar, Turkey, United Arab Emirates, China, Egypt, Cyprus and others. Contact us with your specific destination for processing timelines and document requirements.",
  },
  {
    question: "How do your trade deposits work?",
    answer: "For general sourcing and procurement, we require 50% deposit on the first order to initiate the procurement process. For oil and gas deals (buying, selling, supplying petroleum products), we require 60% initial deposit. Subsequent orders may have different payment terms based on established business relationship. All deposits are applied toward the total cost with transparent itemized invoicing.",
  },
  {
    question: "Do you source products internationally?",
    answer: "Yes. We source new products directly from manufacturers in China, Egypt, and Saudi Arabia at the lowest prices based on your order specifications. We handle supplier identification, price negotiation, order placement, shipping coordination, customs clearing, and delivery to your location in Nigeria. This includes building materials, equipment, consumables, and goods across sectors.",
  },
  {
    question: "What's included in your travel packages?",
    answer: "Complete travel packages include: visa application support and documentation, airline ticket bookings (local and international with flexible fare options), hotel reservations, airport pick-up and drop-off, connections to affordable markets, hospitals, tourist attractions, and historical sites. We can arrange partial or complete packages depending on your needs. 50% deposit required to secure bookings.",
  },
  {
    question: "How does your referral commission program work?",
    answer: "If you refer people to us for either travel or trade services, you earn a percentage commission after each completed transaction. Contact us directly to enroll in the referral program and get details on commission structure and payment terms. This applies to both travel bookings and trade deals.",
  },
  {
    question: "Can you handle oil and gas investment deals?",
    answer: "Yes. Our oil and gas operations include buying, selling, supplying, and shipping petroleum products. We can order directly from refineries and handle complete logistics. Investment opportunities are available with 60% initial deposit. Contact us to discuss specific deal structures, volumes, and partnership terms.",
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

function Index() {
  const [activeJourney, setActiveJourney] = useState<"travel" | "trade">("trade");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const steps = activeJourney === "travel" ? travelSteps : tradeSteps;

  return (
    <>
      {/* Hero with Floating Collage */}
      <section className="gradient-mesh noise-texture relative isolate overflow-hidden bg-primary-deep py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-deep via-primary to-primary-deep/90" />
        
        <div className="container-page relative z-10">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <p className="animate-fade-up stagger-1 text-xs font-bold uppercase tracking-[0.3em] text-accent">
                RC {site.rcNumber} · Jimeta-Yola, Adamawa
              </p>
              <h1 className="animate-fade-up stagger-2 mt-4 text-4xl font-extrabold leading-tight text-primary-foreground sm:text-6xl">
            Your Trusted Partner in{" "}
                <span className="text-accent">Travel</span> and {" "}
                <span className="text-accent">Trade</span>
              </h1>
              <p className="animate-fade-up stagger-3 mt-5 text-lg leading-relaxed text-primary-foreground/80">
                From oil & gas trading and import/export logistics to visa processing and flight bookings — we connect suppliers, manage supply chains, and coordinate complete travel itineraries. Direct sourcing from China, Egypt, and Saudi Arabia with 50% deposit on first order.
              </p>
              <div className="animate-fade-up stagger-4 mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/travel"
                  className="btn-interactive inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground"
                >
                  <Plane className="h-4 w-4" /> Travel
                </Link>
                <Link
                  to="/trade"
                  className="btn-interactive inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary-foreground/30 px-6 py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  <Ship className="h-4 w-4" /> Trade
                </Link>
              </div>
            </div>

            {/* Floating Collage - Travel & Trade Focus */}
            <div className="relative hidden lg:block">
              <div className="animate-float-slow relative">
                <img
                  src={bentoTravelLuggageImg}
                  alt="Travel services"
                  loading="eager"
                  className="h-72 w-full rounded-3xl object-cover shadow-elevated"
                />
              </div>
              <div className="animate-float-delayed absolute -bottom-8 -left-12 w-64">
                <img
                  src={bentoTradeLogisticsImg}
                  alt="Trade and logistics"
                  loading="eager"
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
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <AnimatedSection animation="fade-up">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-primary sm:text-4xl">
                Core business divisions
              </h2>
              <p className="mt-3 text-muted-foreground">
                Travel and Tour, sourcing and Procurement — Two pillars of our business
              </p>
            </div>
          </AnimatedSection>

          <div className="mt-12 grid gap-6 sm:gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {/* Travel and Tour - Large Featured */}
            <AnimatedSection animation="scale" delay={0}>
              <Link
                to="/travel"
                className="card-interactive group relative overflow-hidden rounded-2xl sm:rounded-3xl"
              >
                <div className="aspect-[3/4]">
                  <img
                    src={bentoTravelLuggageImg}
                    alt="Travel and tour services"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-deep via-primary-deep/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10 text-primary-foreground">
                    <Plane className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-accent" />
                    <h3 className="mt-3 sm:mt-4 md:mt-5 text-2xl sm:text-3xl md:text-4xl font-bold">Travel and Tour</h3>
                    <p className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg leading-relaxed text-primary-foreground/85">
                      Complete visa processing, flight bookings, hotel reservations, and tour packages to Germany, Saudi Arabia, Qatar, Turkey, UAE, China, Egypt, Cyprus and more.
                    </p>
                    <div className="mt-4 sm:mt-6 md:mt-8 inline-flex items-center gap-2 text-sm sm:text-base font-bold text-accent">
                      Learn more <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
              </Link>
            </AnimatedSection>

            {/* Sourcing & Procurement - Large Featured */}
            <AnimatedSection animation="scale" delay={100}>
              <Link
                to="/trade"
                hash="sourcing-procurement"
                className="card-interactive group relative overflow-hidden rounded-2xl sm:rounded-3xl"
              >
                <div className="aspect-[3/4]">
                  <img
                    src={bentoTradeSupplyImg}
                    alt="Sourcing and procurement services"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-deep via-primary-deep/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10 text-primary-foreground">
                    <PackageSearch className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-accent" />
                    <h3 className="mt-3 sm:mt-4 md:mt-5 text-2xl sm:text-3xl md:text-4xl font-bold">Sourcing and Procurement</h3>
                    <p className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg leading-relaxed text-primary-foreground/85">
                     Direct international sourcing from trusted global suppliers — competitive pricing, verified credentials, complete delivery management.
                    </p>
                    <div className="mt-4 sm:mt-6 md:mt-8 inline-flex items-center gap-2 text-sm sm:text-base font-bold text-accent">
                      Learn more <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
              </Link>
            </AnimatedSection>

          </div>
        </div>
      </section>

      {/* Sourcing & Procurement Highlight */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <AnimatedSection animation="fade-up">
              <div>
                <span className="inline-block rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                  Procurement Excellence
                </span>
                <h2 className="mt-4 text-3xl font-bold text-primary sm:text-4xl">
                  Direct sourcing and international procurement
                </h2>
                <p className="mt-5 text-muted-foreground leading-relaxed">
                  We source new products directly from manufacturers in China, Egypt, and Saudi Arabia at the lowest prices. Complete order handling from supplier verification to delivery at your location.
                </p>
                
                <div className="mt-8 space-y-5">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-bold text-primary">Product Identification & Sourcing</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Tell us what you need. We identify manufacturers in China, Egypt, and Saudi Arabia offering the best prices based on your order specifications
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold text-primary">Price Negotiation & Order Placement</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        We negotiate transparent pricing and place orders directly with verified suppliers. 50% deposit required on first order to initiate procurement
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold text-primary">Shipping & Delivery Coordination</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Complete logistics handling — freight coordination, customs clearing, and delivery to your specified location with full documentation
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  to="/trade"
                  hash="sourcing-procurement"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground"
                >
                  View Full Procurement Services <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="scale" delay={200}>
              <div className="relative">
                <img
                  src={bentoTradeLogisticsImg}
                  alt="Supply chain operations"
                  loading="lazy"
                  className="h-full w-full rounded-3xl object-cover shadow-elevated"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Travels & Tours - Compact Section */}
      <section className="border-y border-border bg-secondary/40 py-16">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <AnimatedSection animation="fade-up">
              <div>
                <span className="inline-block rounded-full bg-accent-soft px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-foreground">
                  Supporting Service
                </span>
                <h2 className="mt-4 text-2xl font-bold text-primary sm:text-3xl">
                  Travels & Tours
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Complete visa processing and travel packages for tourist, business, medical, Hajj, Umrah, work, and study visas to Germany, Saudi Arabia, Qatar, Turkey, UAE, China, Egypt, Cyprus and more. Flight bookings, hotel reservations, airport transfers, and guided tours.
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span>Multiple Visa Types</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span>Complete Travel Packages</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span>Referral Commission Program</span>
                  </div>
                </div>
                <Link
                  to="/travel"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-accent-foreground underline underline-offset-4"
                >
                  View travel services <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="scale" delay={100}>
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={bentoTravelCoupleImg}
                  alt="Travel services"
                  loading="lazy"
                  className="h-64 w-full object-cover lg:h-80"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Premium Services Showcase - Flip Cards */}
      <section className="py-20 sm:py-24">
        <div className="container-page">
          <AnimatedSection animation="fade-up">
            <div className="text-center">
              <span className="inline-block rounded-full bg-accent-soft px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-foreground">
                Premium Services
              </span>
              <h2 className="mt-4 text-3xl font-bold text-primary sm:text-4xl">
                What we deliver
              </h2>
              <p className="mt-3 text-muted-foreground">
                Hover over each card to explore our comprehensive service offerings
              </p>
            </div>
          </AnimatedSection>

          <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {/* Travel */}
            <AnimatedSection animation="scale" delay={0}>
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 shadow-card transition-all duration-500 hover:shadow-elevated hover:border-accent/30">
                {/* Icon with glow effect */}
                <div className="relative p-8 pb-6">
                  <div className="absolute inset-0 animate-pulse rounded-2xl bg-accent/10 blur-2xl transition-all duration-500 group-hover:bg-accent/20" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary-deep to-primary shadow-card transition-all duration-500 group-hover:scale-110">
                    <Plane className="h-8 w-8 text-white" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Content */}
                <div className="px-8 pb-8">
                  <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                    Complete Travel Services
                  </span>
                  <h3 className="mt-4 text-2xl font-bold text-primary">
                    Travel
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Complete visa processing, flight bookings, hotel reservations, and tour packages to Germany, Saudi Arabia, Qatar, Turkey, UAE, China, Egypt, Cyprus and more.
                  </p>

                  {/* Expandable details - visible on mobile, hover on desktop */}
                  <div className="mt-6 max-h-96 overflow-visible md:max-h-0 md:overflow-hidden md:transition-all md:duration-500 md:group-hover:max-h-96">
                    <div className="border-t border-border pt-4">
                      <h4 className="text-sm font-bold text-primary mb-3">What We Offer</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>All visa types processing</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>Flight bookings & reservations</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>Hotel accommodations</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>Airport transfers & tours</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Hover indicator - desktop only */}
                  <div className="mt-6 hidden md:flex items-center gap-2 text-xs font-bold text-accent">
                    <span>Hover to explore</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Sourcing & Procurement */}
            <AnimatedSection animation="scale" delay={100}>
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 shadow-card transition-all duration-500 hover:shadow-elevated hover:border-accent/30">
                {/* Icon with glow effect */}
                <div className="relative p-8 pb-6">
                  <div className="absolute inset-0 animate-pulse rounded-2xl bg-accent/10 blur-2xl transition-all duration-500 group-hover:bg-accent/20" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent via-accent/90 to-accent shadow-card transition-all duration-500 group-hover:scale-110">
                    <PackageSearch className="h-8 w-8 text-white" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Content */}
                <div className="px-8 pb-8">
                  <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                    International Sourcing
                  </span>
                  <h3 className="mt-4 text-2xl font-bold text-primary">
                    Sourcing & Procurement
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Direct sourcing of new products from our international partners at lowest prices. We find suppliers, verify credentials, and manage complete delivery.
                  </p>

                  {/* Expandable details - visible on mobile, hover on desktop */}
                  <div className="mt-6 max-h-96 overflow-visible md:max-h-0 md:overflow-hidden md:transition-all md:duration-500 md:group-hover:max-h-96">
                    <div className="border-t border-border pt-4">
                      <h4 className="text-sm font-bold text-primary mb-3">Our Process</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>Supplier identification & verification</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>Price negotiation & ordering</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>Complete logistics handling</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>50% deposit on first order</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Hover indicator - desktop only */}
                  <div className="mt-6 hidden md:flex items-center gap-2 text-xs font-bold text-accent">
                    <span>Hover to explore</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Consultation & Referrals */}
            <AnimatedSection animation="scale" delay={200}>
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 shadow-card transition-all duration-500 hover:shadow-elevated hover:border-accent/30">
                {/* Icon with glow effect */}
                <div className="relative p-8 pb-6">
                  <div className="absolute inset-0 animate-pulse rounded-2xl bg-accent/10 blur-2xl transition-all duration-500 group-hover:bg-accent/20" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary-deep to-primary shadow-card transition-all duration-500 group-hover:scale-110">
                    <Users className="h-8 w-8 text-white" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Content */}
                <div className="px-8 pb-8">
                  <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                    Expert Advisory
                  </span>
                  <h3 className="mt-4 text-2xl font-bold text-primary">
                    Consultation & Referrals
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Trade and travel consultation services plus referral commission opportunities for connecting us with new clients.
                  </p>

                  {/* Expandable details - visible on mobile, hover on desktop */}
                  <div className="mt-6 max-h-96 overflow-visible md:max-h-0 md:overflow-hidden md:transition-all md:duration-500 md:group-hover:max-h-96">
                    <div className="border-t border-border pt-4">
                      <h4 className="text-sm font-bold text-primary mb-3">Advisory Services</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>Trade operations and logistics guidance</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>Documentation and compliance support</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>Personalized travel planning</span>
                        </li>
                      </ul>
                      <div className="mt-4 pt-3 border-t border-border/50">
                        <h4 className="text-sm font-bold text-primary mb-2">Referral Program</h4>
                        <p className="text-xs text-muted-foreground">
                          Earn commission when you refer clients to us. Paid after each completed transaction.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hover indicator - desktop only */}
                  <div className="mt-6 hidden md:flex items-center gap-2 text-xs font-bold text-accent">
                    <span>Hover to explore</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </AnimatedSection>
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
        <div className="relative z-10 py-16 sm:py-20 md:py-24 lg:py-32">
          <div className="container-page">
            <AnimatedSection animation="fade-up">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-extrabold text-primary-foreground sm:text-3xl md:text-4xl lg:text-5xl">
                  One partner for trade and travel
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80 sm:mt-4 sm:text-base md:mt-5 md:text-lg">
                  From sourcing products internationally to arranging complete travel packages — we manage logistics, documentation, and coordination. Oil & gas trading with refinery connections, import/export with full clearing, and visa processing with appointment booking all under one roof.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4">
                  <Link
                    to="/quote"
                    className="btn-interactive inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-bold text-accent-foreground sm:w-auto sm:px-6 sm:py-3.5"
                  >
                    Request a Quote <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/about"
                    className="btn-interactive inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary-foreground/30 px-4 py-3 text-sm font-bold text-primary-foreground hover:border-accent sm:w-auto sm:px-6 sm:py-3.5"
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
      <section className="gradient-mesh py-16 sm:py-20">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <AnimatedSection animation="fade-up">
              <div>
                <h2 className="text-3xl font-bold text-primary sm:text-4xl">
                  Five years of trusted service
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Since 2020, we've been processing visas, arranging travel, sourcing products from China, Egypt, and Saudi Arabia, and facilitating oil & gas trade. Our clients trust us with their travel plans and their business deals.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-6">
                  {stats.map((stat, i) => (
                    <div key={stat.label} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                      <p className="font-display text-4xl font-extrabold text-accent">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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
                  className="h-full w-full rounded-3xl object-cover shadow-elevated"
                />
                <div className="absolute -bottom-6 -left-6 -right-6 h-32 bg-gradient-to-t from-background to-transparent" />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How It Works - Interactive Journey */}
      <section className="border-y border-border bg-secondary/30 py-16 sm:py-20">
        <div className="container-page">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary sm:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground">
              From first contact to completion — here's what to expect
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="inline-flex gap-2 rounded-full border border-border bg-card p-1.5 shadow-card">
              <button
                onClick={() => setActiveJourney("trade")}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                  activeJourney === "trade"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                <Ship className="h-4 w-4" /> Trade Journey
              </button>
              <button
                onClick={() => setActiveJourney("travel")}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                  activeJourney === "travel"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                <Plane className="h-4 w-4" /> Travel Journey
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent font-display text-2xl font-extrabold text-accent-foreground">
                    {step.number}
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-primary">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {step.number < 3 && (
                  <div className="absolute left-1/2 top-7 hidden w-full md:block">
                    <ArrowRight className="ml-8 h-5 w-5 text-accent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features with Composite Images */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-primary sm:text-4xl">
                Why businesses trust our supply chain
              </h2>
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-accent" />
                  <div>
                    <h3 className="font-bold text-primary">Documentation discipline</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Purchase orders, delivery notes, quality certificates, customs clearance — every transaction tracked and documented from quote to delivery.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-accent" />
                  <div>
                    <h3 className="font-bold text-primary">Logistics coordination</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Multi-vendor procurement with freight, clearing, and delivery requires project management. We coordinate timelines, manage dependencies, and keep you informed.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-accent" />
                  <div>
                    <h3 className="font-bold text-primary">Supplier verification</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We vet suppliers and freight forwarders — checking references, confirming terms in writing, and ensuring they can deliver to spec before you commit.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-accent" />
                  <div>
                    <h3 className="font-bold text-primary">One accountable relationship</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Corporate clients often need both procurement and travel services for the same project. Managing both through one vendor simplifies coordination and accountability.
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
                  className="h-96 w-full rounded-3xl object-cover shadow-elevated"
                />
                <img
                  src={featuresLogisticsImg}
                  alt="Logistics network"
                  loading="lazy"
                  className="absolute -bottom-8 -left-8 h-48 w-64 rounded-2xl object-cover shadow-elevated"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Trust Section with Worker Photo */}
      <section className="border-y border-border bg-primary py-16 text-primary-foreground sm:py-20">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <AnimatedSection animation="scale" delay={0}>
              <div className="relative">
                <img
                  src={trustWorkerImg}
                  alt="Field operations"
                  loading="lazy"
                  className="h-full w-full rounded-3xl object-cover shadow-elevated"
                />
              </div>
            </AnimatedSection>

            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Why clients keep coming back
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {trustPoints.map((point) => (
                  <div key={point.title} className="rounded-2xl border border-primary-foreground/10 bg-primary-deep p-6">
                    <point.icon className="h-7 w-7 text-accent" />
                    <h3 className="mt-4 font-bold">{point.title}</h3>
                    <p className="mt-2 text-sm text-primary-foreground/75">
                      {point.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore by Category Strip */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <AnimatedSection animation="fade-up">
            <h2 className="text-center text-3xl font-bold text-primary sm:text-4xl">
              Explore our services
            </h2>
          </AnimatedSection>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-deep via-primary-deep/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">
                      Energy Trading
                    </p>
                    <h3 className="mt-1 text-lg font-bold">Oil & Gas</h3>
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
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-deep via-primary-deep/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">
                      Supply Chain
                    </p>
                    <h3 className="mt-1 text-lg font-bold">Sourcing & Procurement</h3>
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
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-deep via-primary-deep/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">
                      Logistics & Trade
                    </p>
                    <h3 className="mt-1 text-lg font-bold">Import/Export</h3>
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
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-deep via-primary-deep/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">
                      Visas & Flights
                    </p>
                    <h3 className="mt-1 text-lg font-bold">Travel Services</h3>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border bg-secondary/50 py-16 sm:py-20">
        <div className="container-page">
          <AnimatedSection animation="fade-up">
            <h2 className="text-3xl font-bold text-primary sm:text-4xl">What clients say</h2>
          </AnimatedSection>
          
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <AnimatedSection
                key={i}
                animation={i % 2 === 0 ? "slide-left" : "slide-right"}
                delay={i * 100}
              >
                <figure className="card-interactive flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <Quote className="h-6 w-6 text-accent" />
                    <span className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
                      {t.division}
                    </span>
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/80">
                    "{t.quote}"
                  </blockquote>
                  <figcaption className="mt-5 border-t border-border pt-4 text-sm">
                    <span className="font-bold text-primary">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">{t.role}</span>
                  </figcaption>
                </figure>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20">
        <div className="container-page max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary sm:text-4xl">
              Common questions
            </h2>
            <p className="mt-3 text-muted-foreground">
              Quick answers to questions we hear most often
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-secondary/50"
                >
                  <span className="font-bold text-primary">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-accent transition-transform ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="border-t border-border bg-secondary/30 px-5 py-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't see your question?{" "}
            <Link to="/contact" className="font-bold text-accent-foreground underline underline-offset-4">
              Contact us
            </Link>{" "}
            and we'll give you a specific answer.
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-primary-deep py-16">
        <div className="container-page flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-3 max-w-xl text-primary-foreground/75">
              Whether you need international sourcing, oil & gas trading, or complete travel packages — send us your requirements. We offer trade and travel consultation plus referral commission opportunities.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/quote"
              className="btn-interactive inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground"
            >
              Get a Quote <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="btn-interactive inline-flex items-center justify-center rounded-full border-2 border-primary-foreground/30 px-6 py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
