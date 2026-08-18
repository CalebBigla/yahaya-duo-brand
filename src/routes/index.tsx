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
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { site, travelServices, tradeServices } from "@/lib/site";

const title = "Yahaya Travel and Trade Co Ltd | Travel & Trade Services, Yola";
const description =
  "Visa processing, flight bookings and tour packages plus oil and gas trade, import export and procurement. Registered Nigerian company RC 9295358 in Jimeta-Yola, Adamawa.";

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

/* PLACEHOLDER TESTIMONIALS — replace with real, attributable client quotes. */
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

const trustPoints = [
  {
    icon: ShieldCheck,
    title: `Registered — RC ${site.rcNumber}`,
    body: "An incorporated Nigerian company with verifiable details and contract-ready documentation.",
  },
  {
    icon: Headphones,
    title: "Reachable on every channel",
    body: "Phone, WhatsApp and email, answered by people who know your file — not a queue.",
  },
  {
    icon: Workflow,
    title: "End-to-end handling",
    body: "From visa checklist to boarding pass, from purchase order to delivery. One point of accountability.",
  },
  {
    icon: Building2,
    title: "Established in Adamawa",
    body: "A physical office at B.M Yelwa Plaza, Jimeta-Yola, serving Adamawa and the wider North East.",
  },
];

function Index() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-primary-deep">
        <img
          src={heroImg}
          alt=""
          width={1920}
          height={1088}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-deep via-primary-deep/85 to-primary-deep/40" />
        <div className="container-page relative py-24 sm:py-32">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
              RC {site.rcNumber} · Jimeta-Yola, Adamawa
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-primary-foreground sm:text-6xl">
              Your trusted partner in{" "}
              <span className="text-accent">travel</span> and{" "}
              <span className="text-accent">trade</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-primary-foreground/80">
              Two divisions under one registered Nigerian company. Visas processed, flights and
              hotels booked, cargo moved, suppliers sourced — handled properly, start to finish.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/travel"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90"
              >
                <Plane className="h-4 w-4" /> Explore Travel Services
              </Link>
              <Link
                to="/trade"
                className="inline-flex items-center justify-center gap-2 rounded-md border-2 border-primary-foreground/30 px-6 py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:border-accent hover:text-accent"
              >
                <Ship className="h-4 w-4" /> Explore Trade Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Division split */}
      <section className="py-16 sm:py-20">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          <DivisionPanel
            tone="travel"
            icon={Plane}
            eyebrow="Travel Division"
            title="Travel Services"
            body="For individuals, families and corporate teams travelling out of Nigeria or within it."
            items={travelServices.map((s) => s.title)}
            to="/travel"
            cta="Explore Travel"
          />
          <DivisionPanel
            tone="trade"
            icon={Ship}
            eyebrow="Trade Division · General Contracts"
            title="Trade & General Contracts"
            body="For businesses, contractors and procurement buyers who need goods sourced, supplied and moved."
            items={tradeServices.map((s) => s.title)}
            to="/trade"
            cta="Explore Trade"
          />
        </div>
      </section>

      {/* Why choose us */}
      <section className="border-y border-border bg-secondary/60 py-16 sm:py-20">
        <div className="container-page">
          <h2 className="max-w-2xl text-3xl font-bold text-primary sm:text-4xl">
            Why clients keep coming back
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((p) => (
              <div key={p.title} className="rounded-xl border border-border bg-card p-6 shadow-card">
                <p.icon className="h-7 w-7 text-accent" />
                <h3 className="mt-4 font-display text-base font-bold text-primary">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-12">
        <div className="container-page grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-extrabold text-accent sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground/65">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <h2 className="text-3xl font-bold text-primary sm:text-4xl">What clients say</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure key={i} className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <Quote className="h-6 w-6 text-accent" />
                  <span className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
                    {t.division}
                  </span>
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/80">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t border-border pt-4 text-sm">
                  <span className="font-bold text-primary">{t.name}</span>
                  <span className="block text-xs text-muted-foreground">{t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
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
              Send us the details of your trip or your supply requirement and we will come back with
              costs and timelines.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/quote"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90"
            >
              Get a Quote <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-md border-2 border-primary-foreground/30 px-6 py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function DivisionPanel({
  tone,
  icon: Icon,
  eyebrow,
  title,
  body,
  items,
  to,
  cta,
}: {
  tone: "travel" | "trade";
  icon: typeof Plane;
  eyebrow: string;
  title: string;
  body: string;
  items: readonly string[];
  to: "/travel" | "/trade";
  cta: string;
}) {
  const isTravel = tone === "travel";
  return (
    <div
      className={`flex flex-col rounded-2xl border p-8 shadow-card ${
        isTravel ? "border-border bg-card" : "border-transparent bg-primary text-primary-foreground"
      }`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-xl ${
          isTravel ? "bg-accent-soft" : "bg-primary-deep"
        }`}
      >
        <Icon className={`h-7 w-7 ${isTravel ? "text-accent-foreground" : "text-accent"}`} />
      </div>
      <p className={`mt-6 text-xs font-bold uppercase tracking-[0.2em] ${isTravel ? "text-accent-foreground/70" : "text-accent"}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-2 text-2xl font-bold sm:text-3xl ${isTravel ? "text-primary" : ""}`}>{title}</h2>
      <p className={`mt-3 text-sm leading-relaxed ${isTravel ? "text-muted-foreground" : "text-primary-foreground/75"}`}>
        {body}
      </p>
      <ul className="mt-6 flex-1 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm font-medium">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {item}
          </li>
        ))}
      </ul>
      <Link
        to={to}
        className={`mt-8 inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90 ${
          isTravel ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
        }`}
      >
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
