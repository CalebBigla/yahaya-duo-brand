import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { ButtonLink } from "@/components/site/Button";
import { EditorialCard } from "@/components/site/EditorialCard";
import { InfoCard } from "@/components/site/InfoCard";
import { Reveal } from "@/components/site/Reveal";
import { ResponsiveImage } from "@/components/site/ResponsiveImage";
import { Section } from "@/components/site/Section";
import { brand } from "@/lib/brand";
import { credentials, discretionPromise, founder, howWeWork, registryUrl, signatureJourneys } from "@/lib/company";
import { images } from "@/lib/images";
import { site } from "@/lib/site";
import { getFeaturedTestimonials, getPublishedHomepage, getPublishedSettings } from "@/lib/queries/website";

const title = "Yahaya Travel & Trade | Private travel and trade, Yola";
const description =
  "A private travel desk for Hajj, Umrah, family, business and medical travel, and a trade and energy desk for procurement, import and export, and petroleum products. Jimeta-Yola, Adamawa. RC 9295358.";

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

/** Keeps a CMS subtitle to one calm sentence or about 25 words. */
function oneSentence(text: string | null | undefined, maxWords = 25): string | null {
  if (!text?.trim()) return null;
  const clean = text.trim().replace(/\s+/g, " ");
  const firstSentence = clean.match(/^.+?[.!?](\s|$)/)?.[0]?.trim();
  if (firstSentence && firstSentence.split(" ").length <= maxWords) return firstSentence;
  const words = clean.split(" ");
  return words.length <= maxWords ? clean : `${words.slice(0, maxWords).join(" ").replace(/[,;:]$/, "")}…`;
}

function Index() {
  const { data: homepage } = useQuery({ queryKey: ["website", "homepage"], queryFn: getPublishedHomepage, staleTime: 60_000 });
  const { data: settings } = useQuery({ queryKey: ["website", "settings"], queryFn: getPublishedSettings, staleTime: 60_000 });
  const { data: testimonials } = useQuery({
    queryKey: ["website", "testimonials", "featured"],
    queryFn: getFeaturedTestimonials,
    staleTime: 60_000,
  });

  const heroTitle = homepage?.hero_title?.trim() || brand.promise;
  const heroSubtitle = oneSentence(homepage?.hero_subtitle) ?? brand.intro;
  const rcNumber = settings?.rc_number ?? site.rcNumber;

  // Proof figures are shown only when the business has published them in the CMS.
  const figures = [
    homepage?.stats_years_experience ? { value: `${homepage.stats_years_experience}+`, label: "years in operation" } : null,
    homepage?.stats_clients_served ? { value: `${homepage.stats_clients_served}+`, label: "clients served" } : null,
    homepage?.stats_destinations ? { value: `${homepage.stats_destinations}+`, label: "destinations arranged" } : null,
  ].filter((f): f is { value: string; label: string } => f !== null);

  return (
    <>
      {/* 1. Hero */}
      <section aria-labelledby="hero-title" className="relative isolate flex min-h-[min(88svh,920px)] items-end overflow-hidden bg-primary-deep">
        <ResponsiveImage
          image={images.homeHero}
          mobile={images.homeHeroMobile}
          alt=""
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20"
          imgClassName="h-full w-full object-cover"
        />
        {/* Scrim keeps the ivory text above 4.5:1 while leaving the photo visible. */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary-deep/95 via-primary-deep/80 to-primary-deep/35 lg:bg-gradient-to-r lg:from-primary-deep/85 lg:via-primary-deep/45 lg:to-transparent" />
        <div className="container-page w-full pb-16 pt-32 md:pb-24 lg:pb-28">
          <div className="max-w-2xl">
            <p className="t-eyebrow animate-fade-up text-accent">Jimeta-Yola · RC {rcNumber}</p>
            <h1 id="hero-title" className="t-h1 animate-fade-up stagger-2 mt-5 text-ivory">
              {heroTitle}
            </h1>
            <p className="t-lead animate-fade-up stagger-3 mt-6 max-w-xl text-on-navy-muted">{heroSubtitle}</p>
            <div className="animate-fade-up stagger-4 mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
              <ButtonLink to="/quote" variant="onDark">
                {brand.advisorAction}
              </ButtonLink>
              <ButtonLink to={brand.desks.trade.path} variant="textOnDark">
                {brand.desks.trade.name} desk <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Two desks */}
      <Section id="desks" title="Two desks, one standard of care" intro={brand.intro}>
        <div className="grid gap-12 md:grid-cols-2 md:gap-8">
          <Reveal>
            <EditorialCard
              image={images.deskTravel}
              eyebrow="For individuals and families"
              title={brand.desks.travel.name}
              description={brand.desks.travel.summary}
              cta={`Explore ${brand.desks.travel.name}`}
              to={brand.desks.travel.path}
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </Reveal>
          <Reveal delay={80}>
            <EditorialCard
              image={images.deskTrade}
              eyebrow="For companies"
              title={brand.desks.trade.name}
              description={brand.desks.trade.summary}
              cta={`Explore ${brand.desks.trade.name}`}
              to={brand.desks.trade.path}
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </Reveal>
        </div>
      </Section>

      {/* 3. Signature journeys */}
      <Section
        id="journeys"
        tone="sand"
        eyebrow={brand.desks.travel.name}
        title="Signature journeys"
        intro="A few of the journeys we arrange most often. Each one is planned around the people travelling."
        action={
          <ButtonLink to={brand.desks.travel.path} variant="text">
            All travel services <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </ButtonLink>
        }
      >
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {signatureJourneys.map((journey, i) => (
            <Reveal key={journey.key} delay={i * 80}>
              <EditorialCard
                image={images[journey.image]}
                title={journey.title}
                description={journey.description}
                cta="Enquire"
                to="/quote"
                search={{ desk: "travel", topic: journey.title }}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 4. How we work */}
      <Section id="how" title="How we work" intro={discretionPromise}>
        <ol className="grid gap-6 md:grid-cols-3">
          {howWeWork.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 80}>
              <InfoCard index={i + 1} title={step.title}>
                {step.body}
              </InfoCard>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* 5. Proof: only what can be verified or was published by the business */}
      <Section id="proof" tone="navy" eyebrow="Credentials" title="A registered Nigerian company">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div className="space-y-8">
            <div className="flex gap-4">
              <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-accent" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <p className="font-display text-2xl text-ivory">RC {rcNumber}</p>
                <p className="t-small mt-1 text-on-navy-muted">
                  Registered with the Corporate Affairs Commission.{" "}
                  <a href={registryUrl} target="_blank" rel="noopener noreferrer" className="link-draw font-semibold text-ivory">
                    Verify on the CAC register
                  </a>
                </p>
              </div>
            </div>
            {figures.length > 0 && (
              <dl className="grid grid-cols-3 gap-6 border-t border-ivory/10 pt-8">
                {figures.map((f) => (
                  <div key={f.label} className="flex flex-col-reverse">
                    <dt className="t-small text-on-navy-muted">{f.label}</dt>
                    <dd className="font-display text-3xl text-ivory">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {credentials.length > 0 && (
              <ul className="space-y-3 border-t border-ivory/10 pt-8 t-small text-on-navy-muted">
                {credentials.map((c) => (
                  <li key={c.name}>
                    <span className="text-ivory">{c.name}</span>
                    {c.detail ? ` · ${c.detail}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {testimonials && testimonials.length > 0 ? (
            <ul className="grid gap-8 md:grid-cols-2">
              {testimonials.slice(0, 4).map((t, i) => (
                <Reveal as="li" key={t.id} delay={i * 80}>
                  <figure className="flex h-full flex-col border-l border-accent pl-6">
                    <blockquote className="t-body text-ivory">“{t.testimonial}”</blockquote>
                    <figcaption className="mt-5 t-small text-on-navy-muted">
                      <span className="font-semibold text-ivory">{t.client_name}</span>
                      {t.client_title ? `, ${t.client_title}` : ""}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </ul>
          ) : null}
        </div>
      </Section>

      {/* 6. Founder's note */}
      <Section id="founder">
        <div className="grid items-center gap-12 md:grid-cols-[0.8fr_1fr] md:gap-16">
          <Reveal>
            <div className="overflow-hidden rounded-lg">
              <ResponsiveImage
                image={images.founder}
                alt={`${founder.name}, ${founder.role}`}
                sizes="(min-width: 768px) 40vw, 100vw"
                imgClassName="aspect-[3/4] h-full w-full object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="t-eyebrow text-accent-ink">From the founder</h2>
            {founder.quote ? (
              <blockquote className="t-h2 mt-5 text-primary">“{founder.quote}”</blockquote>
            ) : (
              <p className="t-h3 mt-5 text-primary">{founder.summary}</p>
            )}
            <p className="mt-8 font-semibold text-primary">{founder.name}</p>
            <p className="t-small text-muted-foreground">{founder.role}</p>
            <ButtonLink to="/about" variant="text" className="mt-6">
              About the company <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </ButtonLink>
          </Reveal>
        </div>
      </Section>

      {/* 7. Closing invitation */}
      <section aria-labelledby="closing-title" className="border-t border-border bg-secondary py-[72px] md:py-28">
        <div className="container-page text-center">
          <Reveal>
            <h2 id="closing-title" className="t-h2 mx-auto max-w-2xl text-primary">
              Tell us where you are going, or what you need moved.
            </h2>
            <p className="t-body mx-auto mt-5 max-w-xl text-muted-foreground">An advisor will reply {brand.responseTime}.</p>
            <div className="mt-10 flex justify-center">
              <ButtonLink to="/quote">{brand.advisorAction}</ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
