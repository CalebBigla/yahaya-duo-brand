import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { travelServices, tradeServices } from "@/lib/site";

const title = "Get a Quote | Yahaya Travel and Trade Co Ltd";
const description =
  "Request a quote for visa processing, flights, tour packages, oil and gas trade, import export or procurement from Yahaya Travel and Trade Co Ltd, Yola.";

export const Route = createFileRoute("/quote")({
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
  return (
    <>
      <PageHero
        eyebrow="Get a quote"
        title="Tell us what you need"
        subtitle="One form for both divisions. Fill it in, review the WhatsApp message and send — we will come back with requirements, timelines and pricing."
      />

      <section className="bg-secondary/50 py-16">
        <div className="container-page max-w-3xl">
          <InquiryForm
            title="Request a quote"
            intro="Hello Yahaya! I would like to request a quote."
            fields={[
              {
                name: "division",
                label: "Division",
                type: "select",
                required: true,
                options: ["Travel Services", "Trade & General Contracts"],
              },
              {
                name: "service",
                label: "Service needed",
                type: "select",
                required: true,
                options: [
                  ...travelServices.map((s) => `Travel — ${s.title}`),
                  ...tradeServices.map((s) => `Trade — ${s.title}`),
                ],
              },
              { name: "name", label: "Full name", required: true },
              { name: "company", label: "Company (if applicable)" },
              { name: "phone", label: "Phone number", type: "tel", required: true },
              { name: "email", label: "Email address", type: "email" },
              { name: "timeline", label: "Preferred date / timeline", type: "date" },
              { name: "budget", label: "Budget range (optional)" },
              {
                name: "message",
                label: "What do you need?",
                type: "textarea",
                required: true,
                placeholder: "Destination and travel dates, or goods, volumes and delivery location",
              },
            ]}
          />
        </div>
      </section>
    </>
  );
}
