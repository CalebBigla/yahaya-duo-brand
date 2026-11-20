import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHero } from "@/components/site/PageHero";
import { getPublishedGallery } from "@/lib/queries/website";

const title = "Media Gallery | Yahaya Travel and Trade Co Ltd";
const description =
  "View published travel, trade, events, team, and partner highlights from Yahaya Travel and Trade Co Ltd.";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/media" },
    ],
    links: [{ rel: "canonical", href: "/media" }],
  }),
  component: MediaPage,
});

function MediaPage() {
  const { data: gallery, isLoading } = useQuery({
    queryKey: ["website", "gallery"],
    queryFn: getPublishedGallery,
    staleTime: 60_000,
  });

  return (
    <>
      <PageHero
        eyebrow="Media"
        title="Travel, trade and people"
        subtitle="A published look at the work, destinations, and partnerships behind Yahaya Travel and Trade."
      />
      <section className="py-[72px] md:py-28">
        <div className="container-page">
          {isLoading ? (
            <p className="t-body text-muted-foreground" role="status">Loading the gallery</p>
          ) : gallery?.length ? (
            <ul className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {gallery.map((item) => (
                <li key={item.id}>
                  <figure>
                    <div className="aspect-[4/5] overflow-hidden rounded-lg bg-secondary">
                      <img
                        src={item.image_url}
                        alt={item.alt_text || item.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <figcaption className="mt-5">
                      <p className="t-eyebrow text-accent-ink">{item.category}</p>
                      <h2 className="t-h3 mt-2 text-primary">{item.title}</h2>
                      {item.description && <p className="t-body mt-2 text-muted-foreground">{item.description}</p>}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          ) : (
            // The header hides Media while the gallery is empty; this covers old links.
            <div className="max-w-xl">
              <h2 className="t-h3 text-primary">Nothing published yet</h2>
              <p className="t-body mt-3 text-muted-foreground">Photographs from our work will appear here.</p>
              <Link to="/" className="link-draw mt-6 inline-flex min-h-11 items-center font-semibold text-primary">
                Back to the homepage
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
