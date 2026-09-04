import { createFileRoute, Link } from "@tanstack/react-router";
import { Plane, Ship, ShieldCheck, Award, FileCheck, Handshake, Target, Users, Eye, Lightbulb, Shield, Clock, Zap, Heart, CheckCircle, DollarSign, Briefcase, Package, Fuel, Globe } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { site } from "@/lib/site";

// Company story image
import companyStoryImg from "@/assets/Minimalist Travel Aesthetic _ Manifesting My Next Journey 🌍✨.jpg";
// CEO image
import ceoImg from "@/assets/YAHAYA.jpg";

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
    role: "Founder/Chief Executive Officer", 
    image: ceoImg,
    bio: "Yahaya is a dedicated Nigerian civil servant and accomplished businessman whose professional journey blends public sector discipline with private sector innovation. With years of experience serving within government systems, he has developed a deep understanding of regulatory frameworks, compliance standards, and institutional operations expertise that now empowers our operations with integrity, order, and strategic foresight.",
    bio2: "Driven by a passion for entrepreneurship and national development, he ventured into business with the vision of creating an enterprise that connects people, products, and opportunities across borders. His hands-on experience in trade, procurement, and travel facilitation has positioned him as a versatile leader capable of navigating both administrative procedures and commercial demands.",
    bio3: "A strong advocate for accountability, capacity building, and sustainable growth, Yahaya ensures that the company maintains transparent processes, client-centered services, and long-term value creation. His leadership reflects a rare balance of disciplined governance, business acumen, and unwavering commitment to operational excellence.",
    bio4: "Under his guidance, the company continues to build a reputation as a dependable partner in travel management, international trade, procurement, and global commerce."
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
    icon: Shield,
    title: "Integrity",
    description: "We uphold honesty and transparency across all client interactions and transactions, building trust through consistent ethical conduct and clear communication.",
  },
  {
    icon: Award,
    title: "Professionalism",
    description: "Our processes are structured, compliant, and executed with expert precision, ensuring quality and reliability in every service delivery.",
  },
  {
    icon: Clock,
    title: "Reliability",
    description: "We deliver what we promise, on time, every time. Our commitment to deadlines and quality standards is unwavering across all service lines.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Technology-driven solutions power our operations, ensuring speed, efficiency, and global reach in an increasingly connected world.",
  },
  {
    icon: Heart,
    title: "Customer Satisfaction",
    description: "Every service is tailored to the unique needs of our clients, with continuous innovation driving long-term satisfaction and service excellence.",
  },
  {
    icon: CheckCircle,
    title: "Compliance",
    description: "We maintain strict adherence to regulatory requirements, international standards, and industry best practices in all our operations.",
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

      {/* Mission, Vision, Philosophy */}
      <section className="bg-gradient-to-br from-primary via-primary-deep to-primary py-16 text-primary-foreground">
        <div className="container-page">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                <Target className="h-8 w-8 text-accent" />
              </div>
              <h2 className="mb-3 text-xl font-bold">Our Mission</h2>
              <p className="text-sm leading-relaxed text-primary-foreground/80">
                To deliver efficient, reliable, and customer-centric travel and trade solutions that enhance mobility, unlock business opportunities, and facilitate global connections.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                <Eye className="h-8 w-8 text-accent" />
              </div>
              <h2 className="mb-3 text-xl font-bold">Our Vision</h2>
              <p className="text-sm leading-relaxed text-primary-foreground/80">
                To become a leading global partner in travel management and international trade facilitation, recognized for excellence, integrity, and operational efficiency.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                <Lightbulb className="h-8 w-8 text-accent" />
              </div>
              <h2 className="mb-3 text-xl font-bold">Corporate Philosophy</h2>
              <p className="text-sm leading-relaxed text-primary-foreground/80">
                We believe that excellence is not a destination but a continuous journey of refinement, ensuring our services remain aligned with international standards and emerging market trends.
              </p>
            </div>
          </div>
        </div>
      </section>

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
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">Core Values</h2>
            <p className="mt-3 text-muted-foreground">
              The principles that guide every aspect of our operations, from visa processing to trade facilitation, ensuring consistent excellence in service delivery.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Strategic Objectives */}
      <section className="border-y border-border bg-secondary/30 py-16">
        <div className="container-page">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-primary sm:text-4xl">Strategic Objectives</h2>
            <p className="mt-3 text-muted-foreground">
              Our operational principles define how we deliver consistent and exceptional results across travel and trade divisions
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20">
                  <Plane className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-primary">Simplify Global Travel</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    To simplify global travel through fast, transparent, and compliant visa and reservation services.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20">
                  <DollarSign className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-primary">Competitive Pricing</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    To deliver competitively priced flight, tour, and hotel solutions tailored to client needs.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20">
                  <Briefcase className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-primary">Trusted Trade Platform</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    To build a trusted platform for trade consultancy, guiding businesses into global markets.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20">
                  <Package className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-primary">End-to-End Logistics Support</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    To provide end-to-end sourcing, procurement, and logistics support for companies of all sizes.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20">
                  <Fuel className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-primary">Oil & Gas Value Chain</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    To establish a solid presence in the oil & gas commodity value chain with consistent, reliable supply.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20">
                  <Globe className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-primary">Import/Export Wholesaler</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    To grow into a leading import/export wholesaler for high-demand international products.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-center">
            <p className="text-sm font-medium leading-relaxed text-foreground">
              Our commitment to excellence, innovation, compliance, and long-term value creation guides every aspect of our operations, ensuring our services remain aligned with client expectations, international standards, and emerging market trends.
            </p>
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
              <div key={i} className="flex max-w-5xl flex-col items-center gap-6 md:flex-row md:items-start">
                {/* Image outside the card */}
                <div className="shrink-0">
                  <div className="h-48 w-48 overflow-hidden rounded-2xl shadow-elevated">
                    <img 
                      src={m.image} 
                      alt={m.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Bio card */}
                <div className="flex-1 rounded-xl border border-border bg-card p-8 shadow-card">
                  <h3 className="text-2xl font-bold text-primary">{m.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-accent">{m.role}</p>
                  <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
                    <p>{m.bio}</p>
                    {m.bio2 && <p>{m.bio2}</p>}
                    {m.bio3 && <p>{m.bio3}</p>}
                    {m.bio4 && <p className="font-medium text-foreground">{m.bio4}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
