import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDown, Briefcase, Check, ChevronDown, FileCheck2, Fuel, PackageSearch, Ship, Store, type LucideIcon } from "lucide-react";

import { ButtonLink } from "@/components/site/Button";
import { InfoCard } from "@/components/site/InfoCard";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { brand } from "@/lib/brand";
import { images } from "@/lib/images";
import { site, tradeServices } from "@/lib/site";
import { getPublishedServices } from "@/lib/queries/website";

const title = `${brand.desks.trade.name} | Procurement, import and export, petroleum products | Yahaya`;
const description =
  "Trade and energy desk in Jimeta-Yola, Adamawa: sourcing and procurement, import and export, petroleum product supply, general trading and trade consultancy, with documentation handled end to end. RC 9295358.";

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

/** How a deal runs, drawn from the process described for each service. */
const dealSteps = [
  { title: "Enquiry", body: "You tell us the product, specification, volume, delivery point and timeline." },
  { title: "Verification", body: "We identify and check suppliers or buyers, and confirm availability and quality requirements." },
  { title: "Proposal", body: "Itemised pricing and terms in writing, with comparative quotes where there is a choice." },
  { title: "Documentation", body: "Orders, permits, certificates and shipping papers prepared and checked before goods move." },
  { title: "Delivery", body: "Logistics tracked to your site or depot, with delivery confirmation and records for your files." },
];

/**
 * Documents the desk handles, as named in the existing service descriptions.
 * TODO(owner): confirm each item is something the company provides today; remove any
 * that are not, and add licences or registrations actually held.
 */
const documents = [
  "Purchase orders and invoices",
  "Waybills and delivery notes",
  "Quality and inspection certificates",
  "Form M and Bill of Lading",
  "SONCAP and SON certification",
  "Customs clearing documentation",
  "Petroleum product licences, where applicable",
];

// Expanded service details with categories, process, lead times, and examples
const serviceDetails = {
  "oil-and-gas-trade": {
    categories: [
      "Supply of petroleum products (PMS, AGO, DPK, LPG)",
      "Trading of crude and refined products",
      "Logistics coordination and depot management",
      "Compliance with local and international energy standards",
      "Quality assurance and product testing",
      "Trading relationships with refineries and depots",
    ],
    process:
      "You specify product type, volume, delivery location, and timeline. We identify vetted suppliers or off-takers, negotiate pricing aligned with current market rates, coordinate quality inspections where needed, handle documentation (purchase orders, PPPRA licenses if applicable, delivery notes), ensure compliance with energy regulations, and track delivery to your designated location or depot.",
    leadTime:
      "Depends on product and volume. Small volumes (trucks) can be arranged within 3-5 days. Large consignments (multiple trucks or depot allocations) require 1-2 weeks for supply coordination, compliance verification, and documentation.",
    example:
      "Need 10,000 liters of AGO delivered to your construction site in Yola? We source from a verified depot, ensure compliance with energy standards, provide a transparent quote (product cost + logistics + our margin), coordinate quality-tested delivery trucks, and provide all documentation for your records and regulatory compliance.",
  },
  "import-export": {
    categories: [
      "Import of machinery, equipment, and spare parts",
      "Export of agricultural produce (grains, sesame, ginger, hibiscus)",
      "Electronics and industrial machinery imports",
      "Food commodities and household goods",
      "Building materials and automotive parts",
      "Customs clearing and freight forwarding coordination",
      "Documentation: Bill of Lading, FORM M, SONCAP, SON certification",
      "Delivery coordination to final destination",
    ],
    process:
      "Tell us what you want to import (or export) and the destination. We identify reliable suppliers (or buyers), provide FOB/CIF pricing, coordinate shipping and clearing, manage customs documentation including SONCAP and SON certification, arrange freight forwarding, and organize final delivery to your warehouse or designated location. For exports, we handle quality inspection, packaging standards, export documentation, and shipping coordination.",
    leadTime:
      "Import lead times: 4-8 weeks depending on origin country and shipping method (sea vs. air). Clearing at Nigerian ports typically adds 1-2 weeks for documentation and customs processing. Export arrangements: 2-4 weeks from order to shipment, depending on product availability, quality inspection, and buyer requirements.",
    example:
      "Importing 2 containers of building materials from China? We source the supplier, negotiate competitive pricing, arrange shipping to Lagos (Apapa or Tin Can), handle customs clearing with SONCAP and SON certification, coordinate freight forwarding, and arrange haulage to your warehouse in Yola — with transparent itemized costs and documentation at every stage.",
  },
  "sourcing-procurement": {
    categories: [
      "Supplier identification and verification",
      "Bulk purchasing and volume negotiations",
      "Negotiation and price optimization",
      "Quality assurance and product inspection",
      "Documentation and logistics support",
      "Delivery coordination to project sites",
      "Building materials (cement, iron rods, roofing sheets, tiles)",
      "Agricultural inputs (fertilizer, seeds, pesticides)",
      "Office and industrial equipment",
    ],
    process:
      "You provide product specifications, quantity, quality requirements, and delivery timeline. We identify 2-3 vetted suppliers through our verification process, present comparative quotes with our recommendation, negotiate optimal pricing, coordinate payment terms (we can facilitate escrow or milestone payments), manage logistics and freight, conduct quality inspection before delivery where feasible, provide comprehensive documentation (invoices, waybills, delivery confirmations, quality certificates), and ensure on-time delivery coordination.",
    leadTime:
      "Local sourcing (Nigerian suppliers): 1-2 weeks for most products with quality verification. International sourcing: 4-8 weeks depending on origin, shipping method, and customs clearance. Urgent requests can be fast-tracked where suppliers allow, though premium costs may apply for expedited sourcing and logistics.",
    example:
      "Need 500 bags of cement delivered to a project site in Mubi? We identify verified dealers, conduct supplier due diligence, negotiate bulk rates with price optimization, arrange quality-inspected haulage, confirm delivery to site with documentation, and provide the invoice, waybill, and quality certificate. For recurring needs, we set up a scheduled supply program so cement arrives as your project progresses with consistent quality.",
  },
  "general-traders": {
    categories: [
      "Manufactured goods and industrial products",
      "Agricultural products (grains, sesame, hibiscus)",
      "Consumer goods and retail supplies",
      "Industrial materials and specialized equipment",
      "Construction materials at wholesale volumes",
      "Grains and food commodities (rice, maize, millet, beans)",
      "Seasonal and bulk trading (harvest procurement, festive stock)",
      "Cross-border trade facilitation within West Africa",
    ],
    process:
      "Operating as a multisector trading hub, we buy and sell goods at volume, either on our own account or as intermediaries connecting buyers and sellers. We handle manufactured goods, agricultural products, consumer goods, and industrial materials. Pricing is transparent and negotiable based on volume, payment terms, and delivery requirements. We manage complete logistics, quality assurance, comprehensive documentation, and delivery coordination to ensure smooth transactions.",
    leadTime:
      "Depends on product type and market conditions. Commodity trades (grains, materials) can close within days if stock is available in our network. Seasonal procurement (e.g., harvest-time buying of agricultural products) requires advance planning and commitment. Industrial and manufactured goods: 1-3 weeks depending on supplier availability.",
    example:
      "Looking to buy 100 tonnes of maize during harvest season? We coordinate with farmers or aggregators across the region, arrange quality inspection and grading, provide warehousing if needed, and deliver to your mill or storage facility at an agreed schedule. Alternatively, if you're a farmer with produce to sell, we connect you with vetted buyers and manage the complete transaction with transparent pricing.",
  },
  "trade-consultancy": {
    categories: [
      "Feasibility studies for market entry and expansion",
      "Market entry strategies and regulatory guidance",
      "Supplier verification and comprehensive due diligence",
      "Regulatory and compliance advisory services",
      "Import/export documentation and compliance guidance",
      "Duty and tariff calculation for imports",
      "Logistics routing optimization (sea, air, or land freight)",
      "Trade finance and payment structure advice",
      "Risk assessment and mitigation strategies",
    ],
    process:
      "We support individuals and companies seeking to expand into international markets through comprehensive consultancy services. You describe your trade challenge, expansion plans, or compliance questions — we provide specific feasibility studies, market entry strategies, regulatory guidance, documentation templates, supplier verification reports, or connect you with the right service providers (clearing agents, freight forwarders, banks, legal advisors). Consultancy can be one-off (single question or project) or ongoing (retained advisory for business expansion and operations).",
    leadTime:
      "Immediate responses for straightforward queries and general guidance. For feasibility studies and detailed market entry strategies: 1-2 weeks for comprehensive analysis. Complex advisory projects (e.g., setting up an import operation, evaluating cross-border trade deals, regulatory compliance assessment): 2-3 weeks with detailed reports and recommendations.",
    example:
      "Planning to start importing electronics from Dubai but unsure of the documentation, duties, and market viability? We conduct a feasibility study, walk you through FORM M requirements, calculate estimated customs duties and levies, advise on SONCAP and SON certification, assess market entry strategies, recommend vetted clearing agents in Lagos, provide supplier verification services, and deliver a comprehensive step-by-step checklist with regulatory compliance guidance so you know exactly what to expect and can make informed decisions before committing capital.",
  },
};

function TradePage() {
  const [selectedService, setSelectedService] = useState<string>("sourcing-procurement");
  const { data: publishedServices } = useQuery({
    queryKey: ["website", "services", "trade"],
    queryFn: () => getPublishedServices("trade"),
    staleTime: 60_000,
  });
  const services = publishedServices ?? tradeServices;

  // Build dynamic form fields based on selected service
  const getFormFields = () => {
    const baseFields = [
      { name: "company", label: "Company name", required: true },
      // Maps to submissions.name (NOT NULL); the company name is stored in submissions.details.
      { name: "name", label: "Contact name", required: true },
      { name: "phone", label: "Phone number", type: "tel" as const, required: true },
      { name: "email", label: "Email address", type: "email" as const },
      {
        name: "service",
        label: "Service needed",
        type: "select" as const,
        required: true,
        options: services.map((s) => s.title),
      },
    ];

    const serviceSpecificFields: Record<string, any[]> = {
      "oil-and-gas-trade": [
        { name: "product", label: "Product type (e.g., AGO, PMS, LPG)", required: true },
        { name: "volume", label: "Volume/quantity needed" },
        { name: "delivery", label: "Delivery location" },
      ],
      "import-export": [
        {
          name: "direction",
          label: "Import or Export?",
          type: "select" as const,
          options: ["Import", "Export"],
        },
        {
          name: "goods",
          label: "Goods description",
          full: true,
          placeholder: "e.g., 2 containers of building materials",
        },
        { name: "origin", label: "Origin/destination country" },
      ],
      "sourcing-procurement": [
        {
          name: "goods",
          label: "Product/goods needed",
          full: true,
          required: true,
          placeholder: "e.g., 500 bags of cement, 50mm diameter",
        },
        { name: "quantity", label: "Quantity" },
        { name: "delivery", label: "Delivery location" },
      ],
      "general-traders": [
        {
          name: "goods",
          label: "Product of interest",
          full: true,
          placeholder: "e.g., 100 tonnes of maize",
        },
        {
          name: "transaction",
          label: "Are you buying or selling?",
          type: "select" as const,
          options: ["Buying", "Selling"],
        },
      ],
      "trade-consultancy": [
        {
          name: "query",
          label: "What do you need advice on?",
          type: "textarea" as const,
          full: true,
          required: true,
          placeholder: "Describe your trade question or challenge",
        },
      ],
    };

    const specificFields = serviceSpecificFields[selectedService] || [
      {
        name: "goods",
        label: "Details of goods/service required",
        full: true,
        placeholder: "e.g., product type, volume, specifications",
      },
    ];

    return [
      ...baseFields,
      ...specificFields,
      {
        name: "message",
        label: "Additional details",
        type: "textarea" as const,
        placeholder: "Timeline, budget, special requirements",
      },
    ];
  };

  return (
    <>
      <PageHero
        image={images.tradeHero}
        eyebrow={brand.desks.trade.name}
        title="Sourcing, trade and energy supply for companies"
        subtitle={brand.desks.trade.summary}
        actions={
          <>
            <ButtonLink to="/quote" search={{ desk: "trade" } as never} variant="onDark">
              {brand.advisorAction}
            </ButtonLink>
            <ButtonLink to="/trade" hash="process" variant="textOnDark">
              How a deal runs <ArrowDown className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </ButtonLink>
          </>
        }
      />

      <Section
        id="services"
        title="Service lines"
        intro={`For corporate clients, contractors, NGOs and government projects. Registered company, RC ${site.rcNumber}.`}
      >
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const details = serviceDetails[service.slug as keyof typeof serviceDetails];
            return (
              <Reveal as="li" key={service.slug} delay={(i % 3) * 80}>
                <InfoCard id={service.slug} icon={icons[service.slug] ?? Briefcase} title={service.title}>
                  <p>{service.summary}</p>
                  {details && (
                    <details className="group mt-5 border-t border-border pt-4">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden">
                        Scope, process and lead time
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" strokeWidth={1.5} aria-hidden="true" />
                      </summary>
                      <ul className="space-y-2 pt-2 t-small">
                        {details.categories.map((item) => (
                          <li key={item} className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <p className="t-small mt-4">
                        <span className="font-semibold text-primary">Process: </span>
                        {details.process}
                      </p>
                      <p className="t-small mt-2">
                        <span className="font-semibold text-primary">Typical lead time: </span>
                        {details.leadTime}
                      </p>
                    </details>
                  )}
                </InfoCard>
              </Reveal>
            );
          })}
        </ul>
      </Section>

      <Section id="process" tone="navy" eyebrow="Process" title="How a deal runs">
        <ol className="grid gap-px overflow-hidden rounded-lg border border-ivory/15 bg-ivory/15 md:grid-cols-5">
          {dealSteps.map((step, i) => (
            <li key={step.title} className="bg-primary p-7">
              <p className="font-display text-2xl text-accent" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-display text-xl text-ivory">{step.title}</h3>
              <p className="t-small mt-2 text-on-navy-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="documents" tone="sand" title="Documentation we handle" intro="Paperwork is where trade goes wrong. These are prepared and checked before goods move.">
        <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <li key={doc} className="flex gap-3 border-t border-border pt-4 text-primary">
              <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-ink" strokeWidth={1.5} aria-hidden="true" />
              {doc}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="inquiry-form" tone="navy" eyebrow="Enquire" title="Request terms" intro={`Choose a service line and the form adapts. An advisor will reply ${brand.responseTime}.`}>
        <div className="max-w-3xl">
          <div role="group" aria-label="Service line" className="mb-8 flex flex-wrap gap-2">
            {services.map((service) => (
              <button
                key={service.slug}
                type="button"
                aria-pressed={selectedService === service.slug}
                onClick={() => setSelectedService(service.slug)}
                className={`min-h-11 rounded-full border px-5 text-sm font-semibold transition-colors ${
                  selectedService === service.slug
                    ? "border-ivory bg-ivory text-primary"
                    : "border-ivory/30 text-ivory hover:border-ivory"
                }`}
              >
                {service.title}
              </button>
            ))}
          </div>
          <InquiryForm
            title="Trade enquiry"
            description="Share what you need supplied, sourced or shipped and we will respond with terms."
            formType="trade"
            fields={getFormFields()}
          />
        </div>
      </Section>
    </>
  );
}
