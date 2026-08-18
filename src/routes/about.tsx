import { createFileRoute, Link } from "@tanstack/react-router";
import { Plane, Ship, ShieldCheck, Award } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { site } from "@/lib/site";

const title = "About Yahaya Travel and Trade Co Ltd | RC 9295358, Jimeta-Yola";
const description =
  "Yahaya Travel and Trade Co Ltd is a registered Nigerian company (RC 9295358) in Jimeta-Yola operating a travel services division and a trade and general contracts division.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

/* PLACEHOLDER CONTENT — replace with real team details before launch. */
const team = [
  { name: "Team member name", role: "Managing Director", initials: "MD" },
  { name: "Team member name", role: "Head, Travel Services", initials: "TS" },
  { name: "Team member name", role: "Head, Trade & Contracts", initials: "TC" },
];

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="A registered Nigerian company built on getting things done"
        subtitle="Two divisions, one standard of service: visas processed, cargo moved, deals sourced."
      />

      <section className="py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">Our story</h2>
            {/* PLACEHOLDER COPY — replace with the real founding story. */}
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Yahaya Travel and Trade Co Ltd was founded in Jimeta-Yola to serve two needs that kept
              arriving at the same door: people who needed a trustworthy hand with visas and travel,
              and businesses who needed goods sourced, supplied and moved. Rather than send clients
              elsewhere, the company built both capabilities in-house.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Today the company operates from B.M Yelwa Plaza, opposite Bachure Junction, serving
              individual travellers, corporate clients and procurement buyers across Adamawa State
              and the wider North East.
            </p>

            <h2 className="mt-12 text-2xl font-bold text-primary sm:text-3xl">
              Two divisions that support each other
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <Plane className="h-6 w-6 text-accent" />
                <h3 className="mt-3 text-lg font-bold text-primary">Travel Services</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Visa processing, flights, hotels, tour packages and travel advisory for
                  individuals, families and corporate teams.
                </p>
                <Link to="/travel" className="mt-4 inline-block text-sm font-bold text-accent-foreground underline underline-offset-4">
                  Explore travel
                </Link>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <Ship className="h-6 w-6 text-accent" />
                <h3 className="mt-3 text-lg font-bold text-primary">Trade & General Contracts</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Oil and gas trade, import and export, sourcing, procurement and trade
                  consultancy for businesses and contractors.
                </p>
                <Link to="/trade" className="mt-4 inline-block text-sm font-bold text-accent-foreground underline underline-offset-4">
                  Explore trade
                </Link>
              </div>
            </div>
            <p className="mt-6 text-muted-foreground">
              The same logistics discipline that clears a shipment also books a group itinerary on
              time. Trade clients travel; travellers ship goods. Keeping both under one roof means
              one accountable point of contact either way.
            </p>
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl border-2 border-accent bg-accent-soft/50 p-6">
              <ShieldCheck className="h-7 w-7 text-accent-foreground" />
              <h3 className="mt-3 font-display text-lg font-bold text-primary">
                Registered and accountable
              </h3>
              <p className="mt-2 text-sm text-foreground/75">
                Incorporated in Nigeria with registration number
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold text-primary">
                RC {site.rcNumber}
              </p>
              <p className="mt-3 text-sm text-foreground/75">
                Contract-ready documentation, verifiable company details and a physical office you
                can visit.
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-border p-6">
              <Award className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-display text-lg font-bold text-primary">Accreditations</h3>
              {/* ADD IF APPLICABLE — confirm IATA / NANTA membership for the travel division. */}
              <p className="mt-2 text-sm text-muted-foreground">
                Add IATA / NANTA accreditation here if applicable to the travel division — it is a
                strong trust signal for visa and flight clients.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/60 py-16">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">Leadership</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Placeholder profiles — replace with real names, roles and photographs before launch.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 text-center shadow-card">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary font-display text-xl font-bold text-accent">
                  {m.initials}
                </div>
                <h3 className="mt-4 font-bold text-primary">{m.name}</h3>
                <p className="text-sm text-muted-foreground">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
