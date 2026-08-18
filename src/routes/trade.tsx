import { createFileRoute } from "@tanstack/react-router";
import { Fuel, Ship, PackageSearch, Store, Briefcase, type LucideIcon } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { tradeServices } from "@/lib/site";
import tradeImg from "@/assets/trade.jpg";

const title = "Trade & General Contracts — Oil and Gas, Import Export Yola | Yahaya";
const description =
  "Oil and gas trade Nigeria, import export Yola, sourcing and procurement, general trading and trade consultancy from Yahaya Travel and Trade Co Ltd.";

export const Route = createFileRoute("/trade")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/trade" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/trade" }],
  }),
  component: TradePage,
});

const icons: Record<string, LucideIcon> = {
  "oil-and-gas-trade": Fuel,
  "import-export": Ship,
  "sourcing-procurement": PackageSearch,
  "general-traders": Store,
  "trade-consultancy": Briefcase,
};

function TradePage() {
  return (
    <>
      <PageHero
        eyebrow="Trade Division · General Contracts"
        title="Trade & General Contracts"
        subtitle="Oil and gas trading, import and export facilitation, sourcing and procurement — delivered with documentation handled and timelines respected."
      />

      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-page grid items-center gap-8 py-12 md:grid-cols-2 md:py-16">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Procurement without the guesswork</h2>
            <p className="mt-4 text-primary-foreground/75">
              We work with buyers, suppliers and contractors across Nigeria. Whether it is a single
              consignment or a running supply contract, we verify the counterparty, agree the terms
              in writing and keep the paperwork clean from purchase order to delivery.
            </p>
            <ul className="mt-6 space-y-2 text-sm font-medium text-primary-foreground/85">
              <li>• Verified suppliers and transparent pricing</li>
              <li>• Logistics, clearing and documentation coordinated</li>
              <li>• Registered company, RC 9295358 — contract-ready</li>
            </ul>
          </div>
          <img
            src={tradeImg}
            alt="Cargo ship and shipping containers at a commercial port"
            width={1200}
            height={900}
            loading="lazy"
            className="w-full rounded-xl object-cover shadow-elevated"
          />
        </div>
      </section>

      {tradeServices.map((service, i) => {
        const Icon = icons[service.slug] ?? Briefcase;
        return (
          <section
            key={service.slug}
            id={service.slug}
            className={`scroll-mt-24 py-14 sm:py-16 ${i % 2 === 1 ? "bg-secondary/50" : "bg-background"}`}
          >
            <div className="container-page grid gap-6 md:grid-cols-[auto_1fr] md:gap-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                <Icon className="h-7 w-7 text-accent" />
              </div>
              <div className="max-w-3xl">
                <h2 className="text-2xl font-bold text-primary sm:text-3xl">{service.title}</h2>
                <p className="mt-2 font-semibold text-accent-foreground/80">{service.summary}</p>
                <p className="mt-4 leading-relaxed text-muted-foreground">{service.detail}</p>
              </div>
            </div>
          </section>
        );
      })}

      <section className="bg-primary-deep py-16">
        <div className="container-page max-w-3xl">
          <InquiryForm
            title="Trade enquiry"
            description="Share what you need supplied, sourced or shipped and we will respond with terms."
            intro="Hello Yahaya! I have a trade enquiry."
            fields={[
              { name: "company", label: "Company name", required: true },
              { name: "contact", label: "Contact name", required: true },
              { name: "phone", label: "Phone number", type: "tel", required: true },
              { name: "email", label: "Email address", type: "email" },
              {
                name: "service",
                label: "Service needed",
                type: "select",
                required: true,
                options: tradeServices.map((s) => s.title),
              },
              {
                name: "goods",
                label: "Goods or service required",
                full: true,
                placeholder: "e.g. 200 tonnes of cement, monthly supply",
              },
              { name: "message", label: "Details", type: "textarea", placeholder: "Volumes, timelines, delivery location" },
            ]}
          />
        </div>
      </section>
    </>
  );
}
