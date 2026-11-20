import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle, Clock, Heart, Shield, ShieldCheck, Zap } from "lucide-react";

import { ButtonLink } from "@/components/site/Button";
import { InfoCard } from "@/components/site/InfoCard";
import { Reveal } from "@/components/site/Reveal";
import { ResponsiveImage } from "@/components/site/ResponsiveImage";
import { Section } from "@/components/site/Section";
import { brand } from "@/lib/brand";
import { credentials, founder, registryUrl } from "@/lib/company";
import { images } from "@/lib/images";
import { site } from "@/lib/site";
import { getPublishedHomepage } from "@/lib/queries/website";

const title = "About | Yahaya Travel & Trade Co Ltd, Jimeta-Yola";
const description =
  "Yahaya Travel and Trade Co Ltd (RC 9295358) is a registered Nigerian company in Jimeta-Yola, Adamawa State, with a private travel desk and a trade and energy desk.";

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

/** Company milestones, from the existing About page. */
const milestones = [
  { year: "2020", title: "Company founded", body: "Established to serve travel, trade and sourcing needs across Nigeria and internationally." },
  { year: "2020", title: "Registered", body: `Incorporated in Nigeria as RC ${site.rcNumber}.` },
  { year: "2021–2024", title: "Trade desk expands", body: "Oil and gas, import and export, and sourcing from China, Egypt and Saudi Arabia." },
  { year: "2025", title: "Office opens", body: `A permanent office at ${site.address.street}, ${site.address.locality}.` },
];

/** The company's stated values, shortened to one line each. */
const values = [
  { icon: Shield, title: "Integrity", body: "Honest, transparent dealings and clear communication." },
  { icon: Award, title: "Professionalism", body: "Structured processes, carried out with care." },
  { icon: Clock, title: "Reliability", body: "We keep to the deadlines and standards we agree." },
  { icon: CheckCircle, title: "Compliance", body: "Regulation and documentation done properly, every time." },
  { icon: Heart, title: "Client care", body: "Each arrangement shaped around the person or company we serve." },
  { icon: Zap, title: "Innovation", body: "Modern tools that make our work faster and clearer." },
];

function AboutPage() {
  const { data: homepage } = useQuery({ queryKey: ["website", "homepage"], queryFn: getPublishedHomepage, staleTime: 60_000 });

  const mission =
    homepage?.mission_content?.trim() ||
    "To deliver efficient, reliable and client-centred travel and trade solutions that open up travel and business opportunities.";
  const vision =
    homepage?.vision_content?.trim() ||
    "To be a trusted partner in travel management and international trade, recognised for integrity and operational excellence.";

  return (
    <>
      {/* Hero: founder portrait beside the headline */}
      <section className="border-b border-border bg-background pb-[72px] pt-14 md:pb-24 md:pt-20">
        <div className="container-page grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
          <div>
            <p className="t-eyebrow animate-fade-up text-accent-ink">About</p>
            <h1 className="t-h1 animate-fade-up stagger-2 mt-4 text-primary">A Yola company, built to be accountable</h1>
            <p className="t-lead animate-fade-up stagger-3 mt-6 measure text-muted-foreground">
              Registered in 2020, Yahaya Travel and Trade runs a private travel desk and a trade and energy desk from one office in Jimeta-Yola.
            </p>
          </div>
          <div className="animate-fade-in overflow-hidden rounded-lg">
            <ResponsiveImage
              image={images.founder}
              alt={`${founder.name}, ${founder.role}`}
              priority
              sizes="(min-width: 768px) 40vw, 100vw"
              imgClassName="aspect-[4/5] h-full w-full object-cover object-top"
            />
          </div>
        </div>
      </section>

      {/* Story. TODO(owner): replace with the real founding story; this is the existing copy, shortened. */}
      <Section id="story" title="Why one company does both">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <p className="t-body text-muted-foreground">
            People in Jimeta-Yola needed help with visas and international travel, and businesses needed goods sourced, checked and delivered without the risk of unknown suppliers. Rather than send clients elsewhere, we built both capabilities under one roof.
          </p>
          <p className="t-body text-muted-foreground">
            The two desks share the same discipline: precise paperwork, tracked timelines and partners checked before we rely on them. Clients who travel sometimes ship goods, and buyers sometimes travel for site visits, so one accountable relationship is simpler than two.
          </p>
        </div>
      </Section>

      {/* Founder */}
      <Section id="founder" tone="white" eyebrow="Leadership" title={founder.name}>
        <Reveal className="max-w-3xl">
          <p className="t-small font-semibold uppercase tracking-[0.12em] text-accent-ink">{founder.role}</p>
          {founder.quote && <blockquote className="t-h3 mt-6 text-primary">“{founder.quote}”</blockquote>}
          <div className="mt-6 space-y-5">
            {founder.bio.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="t-body text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* Mission and vision (from the CMS when published) */}
      <Section id="purpose" tone="navy">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="t-eyebrow text-accent">{homepage?.mission_title?.trim() || "Mission"}</h2>
            <p className="mt-4 font-display text-2xl leading-snug text-ivory">{mission}</p>
          </div>
          <div>
            <h2 className="t-eyebrow text-accent">{homepage?.vision_title?.trim() || "Vision"}</h2>
            <p className="mt-4 font-display text-2xl leading-snug text-ivory">{vision}</p>
          </div>
        </div>
      </Section>

      {/* Milestones */}
      <Section id="milestones" title="Milestones">
        <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
          {milestones.map((m) => (
            <li key={m.title} className="bg-card p-7">
              <p className="font-display text-xl text-accent-ink">{m.year}</p>
              <h3 className="mt-3 font-display text-xl text-primary">{m.title}</h3>
              <p className="t-small mt-2 text-muted-foreground">{m.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Values */}
      <Section id="values" tone="sand" title="What we hold to">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v, i) => (
            <Reveal as="li" key={v.title} delay={(i % 3) * 80}>
              <InfoCard icon={v.icon} title={v.title}>
                {v.body}
              </InfoCard>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* Credentials: only verifiable facts */}
      <Section id="credentials" title="Registered and accountable">
        <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:gap-16">
          <div className="flex gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="font-display text-2xl text-primary">RC {site.rcNumber}</p>
              <p className="t-small mt-1 text-muted-foreground">
                Registered with the Corporate Affairs Commission.{" "}
                <a href={registryUrl} target="_blank" rel="noopener noreferrer" className="link-draw font-semibold text-primary">
                  Verify on the CAC register
                </a>
              </p>
              <p className="t-small mt-4 text-muted-foreground">{site.addressLine}</p>
            </div>
          </div>
          {credentials.length > 0 && (
            <ul className="space-y-3 t-body text-primary">
              {credentials.map((c) => (
                <li key={c.name} className="border-t border-border pt-3">
                  {c.name}
                  {c.detail ? <span className="text-muted-foreground"> · {c.detail}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      <section className="border-t border-border bg-secondary py-[72px] text-center md:py-24">
        <div className="container-page">
          <h2 className="t-h2 mx-auto max-w-2xl text-primary">Speak to someone who knows your file</h2>
          <p className="t-body mx-auto mt-5 max-w-xl text-muted-foreground">An advisor will reply {brand.responseTime}.</p>
          <div className="mt-10 flex justify-center">
            <ButtonLink to="/quote">{brand.advisorAction}</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
