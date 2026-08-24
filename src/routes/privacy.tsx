import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { site } from "@/lib/site";

const title = "Privacy Policy | Yahaya Travel and Trade Co Ltd";
const description =
  "How Yahaya Travel and Trade Co Ltd handles the information you share through this website and our enquiry forms.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="Placeholder policy — review with a legal adviser and replace before launch."
      />
      <section className="py-16">
        <div className="container-page max-w-3xl space-y-6 text-muted-foreground">
          <h2 className="font-display text-xl font-bold text-primary">Information we collect</h2>
          <p>
            This website does not store form submissions. Details entered into an enquiry form are
            packaged into a WhatsApp message on your device, which you review and send yourself.
            Once sent, that message is held in your WhatsApp conversation with us.
          </p>
          <h2 className="font-display text-xl font-bold text-primary">How we use it</h2>
          <p>
            Information you share by WhatsApp, phone or email is used only to respond to your
            enquiry and deliver the travel or trade service requested.
          </p>
          <h2 className="font-display text-xl font-bold text-primary">Sharing</h2>
          <p>
            We share details with third parties only where it is necessary to fulfil your request —
            for example an airline, hotel, embassy, supplier or logistics partner.
          </p>
          <h2 className="font-display text-xl font-bold text-primary">Contact</h2>
          <p>
            Questions about this policy can be sent to{" "}
            <a href={`mailto:${site.email}`} className="font-semibold text-primary underline underline-offset-4">
              {site.email}
            </a>{" "}
            or to our office at {site.addressLine}.
          </p>
        </div>
      </section>
    </>
  );
}
