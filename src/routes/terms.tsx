import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { site } from "@/lib/site";

const title = "Terms of Service | Yahaya Travel and Trade Co Ltd";
const description =
  "Terms governing the use of the Yahaya Travel and Trade Co Ltd website and the travel and trade services we provide.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of Service"
        subtitle="Placeholder terms — review with a legal adviser and replace before launch."
      />
      <section className="py-16">
        <div className="container-page max-w-3xl space-y-6 text-muted-foreground">
          <h2 className="font-display text-xl font-bold text-primary">Use of this website</h2>
          <p>
            Content on this site is provided for general information about the services of{" "}
            {site.name} (RC {site.rcNumber}). Service details, availability and pricing are
            confirmed in writing at the point of engagement.
          </p>
          <h2 className="font-display text-xl font-bold text-primary">Enquiries and quotations</h2>
          <p>
            Quotations issued in response to an enquiry are indicative until confirmed, and remain
            subject to supplier, airline, embassy and regulatory conditions outside our control.
          </p>
          <h2 className="font-display text-xl font-bold text-primary">Third-party services</h2>
          <p>
            Where we act as an intermediary — with airlines, hotels, embassies, suppliers or
            carriers — the terms of those providers also apply to your booking or transaction.
          </p>
          <h2 className="font-display text-xl font-bold text-primary">Contact</h2>
          <p>
            Questions about these terms can be sent to{" "}
            <a href={`mailto:${site.email}`} className="font-semibold text-primary underline underline-offset-4">
              {site.email}
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
