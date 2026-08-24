import { createFileRoute, Link } from "@tanstack/react-router";
import { Plane, Ship, ShieldCheck, Award, FileCheck, Handshake, Target, Users } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { site } from "@/lib/site";

// Company story image
import companyStoryImg from "@/assets/download (25).jpg";
// CEO image
import ceoImg from "@/assets/CEO.jpeg";

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

/* Company leadership */
const team = [
  { 
    name: "Yahaya Muhammad Umar", 
    role: "Chief Executive Officer", 
    image: ceoImg,
    bio: "Founder and CEO of Yahaya Travel and Trade Co Ltd, leading both travel services and trade operations since 2020."
  },
];

/* Real company milestones */
const milestones = [
  {
    year: "2020",
    title: "Company founded",
    description: "Yahaya Travel and Trade Co Ltd established to serve travel, trade, and sourcing needs across Nigeria and internationally.",
  },
  {
    year: "2020",
    title: "RC registration confirmed",
    description: `Incorporated as a Nigerian company with registration number ${site.rcNumber}, providing verifiable legal standing for contracts and transactions.`,
  },
  {
    year: "2021-2024",
    title: "Trade division expansion",
    description: "Expanded service offering into oil and gas trade, import/export, sourcing from China, Egypt, and Saudi Arabia, operating under the General Contracts sub-brand.",
  },
  {
    year: "2025",
    title: "Office establishment",
    description: "Opened permanent office at B.M Yelwa Plaza, Opp. Bachure Junction, providing a physical location for clients across Adamawa State.",
  },
];

const values = [
  {
    icon: FileCheck,
    title: "Transparency in documentation",
    description: "Every transaction, whether a visa application or a procurement order, is backed by clear paperwork you can verify. Itemized quotes, purchase orders, delivery notes — nothing is left to memory or verbal promises. We document because that's how trust is built and maintained.",
  },
  {
    icon: Handshake,
    title: "Reliability in delivery",
    description: "When we commit to a timeline, we track it and communicate proactively if anything shifts. Visas processed on schedule, goods delivered as agreed, flights booked when promised. Our reputation depends on doing what we said we'd do, when we said we'd do it.",
  },
  {
    icon: Target,
    title: "Accountability from start to finish",
    description: "You don't get handed off between departments or left wondering who's responsible. One point of contact manages your file from first enquiry to final delivery, so there's always someone who knows your case and can answer your questions.",
  },
  {
    icon: Users,
    title: "Responsiveness across channels",
    description: "Call, WhatsApp, email — we respond on the channel that works for you, and we respond promptly. For urgent cases (tight visa deadlines, time-sensitive procurement), we prioritize and keep you updated in real time.",
  },
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
              Yahaya Travel and Trade Co Ltd was founded in Jimeta-Yola to solve a problem that kept showing up at the same door: people needed help navigating visa applications and international travel, and businesses needed goods sourced, verified, and delivered without the risk of dealing with unknown suppliers. Rather than refer clients elsewhere, we built both capabilities under one roof.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              The two divisions aren't a random pairing — they share the same operational discipline. The same attention to documentation that gets a visa approved also keeps a procurement transaction clean and traceable. The same logistics coordination that moves a shipment also arranges a group itinerary. Clients who travel sometimes ship goods; procurement buyers sometimes travel for site visits. Having both services in-house means one accountable relationship, not two vendors to manage.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Today, the company operates from B.M Yelwa Plaza, opposite Bachure Junction, serving individual travelers, corporate clients, and procurement buyers across Adamawa State and the wider North East. We're registered (RC {site.rcNumber}), reachable on three phone lines and WhatsApp, and we show up when you need us.
            </p>

            <h2 className="mt-12 text-2xl font-bold text-primary sm:text-3xl">
              Why two divisions work better together
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Some companies split travel and trade into separate businesses. We keep them together deliberately, because the skills overlap more than they seem to at first glance:
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span><strong className="text-foreground">Documentation discipline:</strong> Visa applications and procurement contracts both require precise paperwork, tracked timelines, and clear communication with third parties (embassies, suppliers, clearing agents).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span><strong className="text-foreground">Logistics coordination:</strong> Arranging a group tour with flights, hotels, and transfers uses the same project management skills as coordinating a multi-vendor procurement order with clearing, haulage, and on-site delivery.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span><strong className="text-foreground">Vendor verification:</strong> We vet hotels, airlines, and tour operators the same way we vet suppliers and freight forwarders — checking references, confirming terms in writing, and building a trusted network over time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span><strong className="text-foreground">Client overlap:</strong> Corporate clients book travel for site visits and source materials for projects. Individual travelers ship goods home. Managing both needs through one relationship is simpler than coordinating two vendors.</span>
              </li>
            </ul>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
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
          </div>

          <aside className="space-y-6">
            {/* Human-focused image beside company story */}
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src={companyStoryImg}
                alt="Happy travelers"
                loading="lazy"
                className="h-64 w-full object-cover shadow-card lg:h-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-deep/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-sm font-bold text-primary-foreground">
                  Real people, real service
                </p>
                <p className="mt-1 text-xs text-primary-foreground/80">
                  Behind every visa file and procurement order is a team committed to getting it done right
                </p>
              </div>
            </div>

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

      {/* Company Timeline */}
      <section className="border-y border-border bg-secondary/60 py-16">
        <div className="container-page">
          <h2 className="text-center text-2xl font-bold text-primary sm:text-3xl">Our journey</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Key milestones in building Yahaya Travel and Trade Co Ltd — placeholder dates, replace with real timeline before launch
          </p>
          
          <div className="relative mt-12">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-accent/30 md:block" />
            
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative grid gap-6 md:grid-cols-2 md:gap-12 ${index % 2 === 0 ? "" : "md:grid-flow-dense"}`}>
                  <div className={`${index % 2 === 0 ? "md:text-right" : "md:col-start-2"}`}>
                    <div className="inline-block rounded-full bg-accent px-4 py-1.5 font-display text-sm font-bold text-accent-foreground">
                      {milestone.year}
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-primary">{milestone.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{milestone.description}</p>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 top-0 hidden h-4 w-4 -translate-x-1/2 rounded-full border-4 border-background bg-accent md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16">
        <div className="container-page">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">How we work</h2>
            <p className="mt-3 text-muted-foreground">
              These aren't aspirational buzzwords — they're the operational principles that guide every visa file we process and every procurement order we handle.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {values.map((value) => (
              <div key={value.title} className="rounded-xl border border-border bg-card p-6 shadow-card">
                <value.icon className="h-7 w-7 text-accent" />
                <h3 className="mt-4 text-lg font-bold text-primary">{value.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/60 py-16">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">Leadership</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Meet the leadership behind Yahaya Travel and Trade Co Ltd
          </p>
          <div className="mt-8 flex justify-center">
            {team.map((m, i) => (
              <div key={i} className="max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-card">
                <div className="mx-auto h-32 w-32 overflow-hidden rounded-full">
                  <img 
                    src={m.image} 
                    alt={m.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="mt-6 text-xl font-bold text-primary">{m.name}</h3>
                <p className="mt-1 text-sm font-semibold text-accent">{m.role}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
