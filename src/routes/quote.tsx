import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { ConciergeEnquiry, type Desk } from "@/components/forms/ConciergeEnquiry";
import { brand } from "@/lib/brand";
import { useSiteSettings } from "@/lib/useSiteSettings";

const title = "Enquire | Yahaya Travel & Trade";
const description =
  "Start an enquiry with the Private Travel desk or the Trade & Energy desk. An advisor will reply within one business day.";

export const Route = createFileRoute("/quote")({
  // ?desk=travel|trade and ?topic=… pre-fill the flow from journey and destination cards.
  validateSearch: (search: Record<string, unknown>): { desk?: Desk; topic?: string } => {
    const desk = search["desk"] === "travel" || search["desk"] === "trade" ? (search["desk"] as Desk) : undefined;
    const topic = typeof search["topic"] === "string" ? search["topic"].slice(0, 80) : undefined;
    return { ...(desk ? { desk } : {}), ...(topic ? { topic } : {}) };
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/quote" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/quote" }],
  }),
  component: QuotePage,
});

function QuotePage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { desk, topic } = Route.useSearch();
  const settings = useSiteSettings();

  // The public quote viewer (/quote/view/$token) renders inside this route.
  if (pathname.startsWith("/quote/view/")) {
    return <Outlet />;
  }

  return (
    <>
      <PageHero
        eyebrow="Enquire"
        title={brand.advisorAction}
        subtitle={`Three short steps. An advisor will reply ${brand.responseTime}.`}
      />
      <section className="bg-secondary py-[72px] md:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-[1.5fr_0.7fr] lg:gap-16">
          <ConciergeEnquiry initialDesk={desk} topic={topic} />
          <aside className="space-y-6 t-small text-muted-foreground">
            <div>
              <h2 className="t-eyebrow text-accent-ink">Prefer to talk now?</h2>
              <p className="mt-3">
                <a href={settings.whatsappUrl()} target="_blank" rel="noopener noreferrer" className="link-draw font-semibold text-primary">
                  Message us on WhatsApp
                </a>{" "}
                or call{" "}
                <a href={settings.telHref} className="link-draw font-semibold text-primary">
                  {settings.primaryPhone}
                </a>
                .
              </p>
            </div>
            <div>
              <h2 className="t-eyebrow text-accent-ink">What happens next</h2>
              <p className="mt-3">An advisor reads your enquiry, contacts you the way you prefer, and sends options and terms in writing before anything is booked or ordered.</p>
            </div>
            <div>
              <h2 className="t-eyebrow text-accent-ink">Your information</h2>
              <p className="mt-3">
                Used only to answer your enquiry. See our{" "}
                <Link to="/privacy" className="link-draw font-semibold text-primary">
                  privacy notice
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
