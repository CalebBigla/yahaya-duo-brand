import { createFileRoute } from "@tanstack/react-router";
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
      <section className="py-16">
        <div className="container-page">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading gallery...</p>
          ) : gallery?.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((item) => (
                <figure
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                >
                  <img
                    src={item.image_url}
                    alt={item.alt_text || item.title}
                    loading="lazy"
                    className="h-64 w-full object-cover"
                  />
                  <figcaption className="p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">
                      {item.category}
                    </p>
                    <h2 className="mt-2 text-lg font-bold text-primary">{item.title}</h2>
                    {item.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-12 text-center">
              <h2 className="text-xl font-bold text-primary">Gallery coming soon</h2>
              <p className="mt-2 text-muted-foreground">
                Published photos and highlights will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
