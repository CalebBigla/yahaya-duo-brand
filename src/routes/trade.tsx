import { createFileRoute } from "@tanstack/react-router";
import { Fuel, Ship, PackageSearch, Store, Briefcase, Clock, FileText, CheckCircle2, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { tradeServices } from "@/lib/site";
import tradeImg from "@/assets/trade.jpg";

// Page hero image
import heroImg from "@/assets/Import export training in karachi lahore islamabad pakistan.jpg";

// Service section images
import oilGasImg from "@/assets/The Last Bow at Dusk.jpg";
import importExportImg from "@/assets/Vietnam needs to nurture efficient logistics sector, adapt modern tech.jpg";
import procurementImg from "@/assets/petroleum engineering.jpg";

const title = "Trade, Procurement & General Commerce — Oil & Gas, Import Export | Yahaya";
const description =
  "Multisector trading hub: Oil and gas with compliance, import-export with full documentation, sourcing and procurement with quality assurance, general trading, and trade consultancy including feasibility studies and market entry strategies. Serving corporate, NGO, and government clients across Nigeria.";

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
    process: "You specify product type, volume, delivery location, and timeline. We identify vetted suppliers or off-takers, negotiate pricing aligned with current market rates, coordinate quality inspections where needed, handle documentation (purchase orders, PPPRA licenses if applicable, delivery notes), ensure compliance with energy regulations, and track delivery to your designated location or depot.",
    leadTime: "Depends on product and volume. Small volumes (trucks) can be arranged within 3-5 days. Large consignments (multiple trucks or depot allocations) require 1-2 weeks for supply coordination, compliance verification, and documentation.",
    example: "Need 10,000 liters of AGO delivered to your construction site in Yola? We source from a verified depot, ensure compliance with energy standards, provide a transparent quote (product cost + logistics + our margin), coordinate quality-tested delivery trucks, and provide all documentation for your records and regulatory compliance.",
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
    process: "Tell us what you want to import (or export) and the destination. We identify reliable suppliers (or buyers), provide FOB/CIF pricing, coordinate shipping and clearing, manage customs documentation including SONCAP and SON certification, arrange freight forwarding, and organize final delivery to your warehouse or designated location. For exports, we handle quality inspection, packaging standards, export documentation, and shipping coordination.",
    leadTime: "Import lead times: 4-8 weeks depending on origin country and shipping method (sea vs. air). Clearing at Nigerian ports typically adds 1-2 weeks for documentation and customs processing. Export arrangements: 2-4 weeks from order to shipment, depending on product availability, quality inspection, and buyer requirements.",
    example: "Importing 2 containers of building materials from China? We source the supplier, negotiate competitive pricing, arrange shipping to Lagos (Apapa or Tin Can), handle customs clearing with SONCAP and SON certification, coordinate freight forwarding, and arrange haulage to your warehouse in Yola — with transparent itemized costs and documentation at every stage.",
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
    process: "You provide product specifications, quantity, quality requirements, and delivery timeline. We identify 2-3 vetted suppliers through our verification process, present comparative quotes with our recommendation, negotiate optimal pricing, coordinate payment terms (we can facilitate escrow or milestone payments), manage logistics and freight, conduct quality inspection before delivery where feasible, provide comprehensive documentation (invoices, waybills, delivery confirmations, quality certificates), and ensure on-time delivery coordination.",
    leadTime: "Local sourcing (Nigerian suppliers): 1-2 weeks for most products with quality verification. International sourcing: 4-8 weeks depending on origin, shipping method, and customs clearance. Urgent requests can be fast-tracked where suppliers allow, though premium costs may apply for expedited sourcing and logistics.",
    example: "Need 500 bags of cement delivered to a project site in Mubi? We identify verified dealers, conduct supplier due diligence, negotiate bulk rates with price optimization, arrange quality-inspected haulage, confirm delivery to site with documentation, and provide the invoice, waybill, and quality certificate. For recurring needs, we set up a scheduled supply program so cement arrives as your project progresses with consistent quality.",
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
    process: "Operating as a multisector trading hub, we buy and sell goods at volume, either on our own account or as intermediaries connecting buyers and sellers. We handle manufactured goods, agricultural products, consumer goods, and industrial materials. Pricing is transparent and negotiable based on volume, payment terms, and delivery requirements. We manage complete logistics, quality assurance, comprehensive documentation, and delivery coordination to ensure smooth transactions.",
    leadTime: "Depends on product type and market conditions. Commodity trades (grains, materials) can close within days if stock is available in our network. Seasonal procurement (e.g., harvest-time buying of agricultural products) requires advance planning and commitment. Industrial and manufactured goods: 1-3 weeks depending on supplier availability.",
    example: "Looking to buy 100 tonnes of maize during harvest season? We coordinate with farmers or aggregators across the region, arrange quality inspection and grading, provide warehousing if needed, and deliver to your mill or storage facility at an agreed schedule. Alternatively, if you're a farmer with produce to sell, we connect you with vetted buyers and manage the complete transaction with transparent pricing.",
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
    process: "We support individuals and companies seeking to expand into international markets through comprehensive consultancy services. You describe your trade challenge, expansion plans, or compliance questions — we provide specific feasibility studies, market entry strategies, regulatory guidance, documentation templates, supplier verification reports, or connect you with the right service providers (clearing agents, freight forwarders, banks, legal advisors). Consultancy can be one-off (single question or project) or ongoing (retained advisory for business expansion and operations).",
    leadTime: "Immediate responses for straightforward queries and general guidance. For feasibility studies and detailed market entry strategies: 1-2 weeks for comprehensive analysis. Complex advisory projects (e.g., setting up an import operation, evaluating cross-border trade deals, regulatory compliance assessment): 2-3 weeks with detailed reports and recommendations.",
    example: "Planning to start importing electronics from Dubai but unsure of the documentation, duties, and market viability? We conduct a feasibility study, walk you through FORM M requirements, calculate estimated customs duties and levies, advise on SONCAP and SON certification, assess market entry strategies, recommend vetted clearing agents in Lagos, provide supplier verification services, and deliver a comprehensive step-by-step checklist with regulatory compliance guidance so you know exactly what to expect and can make informed decisions before committing capital.",
  },
};

function TradePage() {
  const [selectedService, setSelectedService] = useState<string>("sourcing-procurement");

  // Build dynamic form fields based on selected service
  const getFormFields = () => {
    const baseFields = [
      { name: "company", label: "Company name", required: true },
      { name: "contact", label: "Contact name", required: true },
      { name: "phone", label: "Phone number", type: "tel" as const, required: true },
      { name: "email", label: "Email address", type: "email" as const },
      {
        name: "service",
        label: "Service needed",
        type: "select" as const,
        required: true,
        options: tradeServices.map((s) => s.title),
      },
    ];

    const serviceSpecificFields: Record<string, any[]> = {
      "oil-and-gas-trade": [
        { name: "product", label: "Product type (e.g., AGO, PMS, LPG)", required: true },
        { name: "volume", label: "Volume/quantity needed" },
        { name: "delivery", label: "Delivery location" },
      ],
      "import-export": [
        { name: "direction", label: "Import or Export?", type: "select" as const, options: ["Import", "Export"] },
        { name: "goods", label: "Goods description", full: true, placeholder: "e.g., 2 containers of building materials" },
        { name: "origin", label: "Origin/destination country" },
      ],
      "sourcing-procurement": [
        { name: "goods", label: "Product/goods needed", full: true, required: true, placeholder: "e.g., 500 bags of cement, 50mm diameter" },
        { name: "quantity", label: "Quantity" },
        { name: "delivery", label: "Delivery location" },
      ],
      "general-traders": [
        { name: "goods", label: "Product of interest", full: true, placeholder: "e.g., 100 tonnes of maize" },
        { name: "transaction", label: "Are you buying or selling?", type: "select" as const, options: ["Buying", "Selling"] },
      ],
      "trade-consultancy": [
        { name: "query", label: "What do you need advice on?", type: "textarea" as const, full: true, required: true, placeholder: "Describe your trade question or challenge" },
      ],
    };

    const specificFields = serviceSpecificFields[selectedService] || [
      { name: "goods", label: "Details of goods/service required", full: true, placeholder: "e.g., product type, volume, specifications" },
    ];

    return [
      ...baseFields,
      ...specificFields,
      { name: "message", label: "Additional details", type: "textarea" as const, placeholder: "Timeline, budget, special requirements" },
    ];
  };

  return (
    <>
      {/* Full-width Hero Banner */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt="Global logistics and trade operations"
          loading="eager"
          className="h-96 w-full object-cover lg:h-[28rem]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/95 via-primary-deep/85 to-primary-deep/70" />
        <div className="absolute inset-0 flex items-center">
          <div className="container-page">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
                Trade Division · General Contracts
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight text-primary-foreground sm:text-5xl lg:text-6xl">
                Trade, Procurement & General Commerce
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-primary-foreground/85">
                Multisector trading hub specializing in oil and gas, import-export facilitation, sourcing and procurement, and trade consultancy — delivered with verified suppliers, regulatory compliance, and comprehensive documentation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container-page grid items-center gap-8 py-12 md:grid-cols-2 md:py-16">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Comprehensive trade solutions without the guesswork</h2>
            <p className="mt-4 text-primary-foreground/75">
              Operating as a multisector trading hub, we work with buyers, suppliers, contractors, and institutions across Nigeria and internationally. From feasibility studies to final delivery, we verify counterparties, provide regulatory compliance guidance, negotiate optimal terms in writing, and maintain comprehensive documentation from purchase order to delivery.
            </p>
            <ul className="mt-6 space-y-2 text-sm font-medium text-primary-foreground/85">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Verified suppliers with due diligence and transparent pricing
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Logistics, clearing, regulatory compliance and documentation coordinated
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Trade consultancy: feasibility studies, market entry strategies, compliance advisory
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Registered company, RC 9295358 — contract-ready for corporate, NGO, and government clients
              </li>
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

      {/* Detailed Services */}
      {tradeServices.map((service, i) => {
        const Icon = icons[service.slug] ?? Briefcase;
        const details = serviceDetails[service.slug as keyof typeof serviceDetails];
        return (
          <section
            key={service.slug}
            id={service.slug}
            className={`scroll-mt-24 py-14 sm:py-16 ${i % 2 === 1 ? "bg-secondary/50" : "bg-background"}`}
          >
            <div className="container-page">
              <div className="grid gap-6 md:grid-cols-[auto_1fr] md:gap-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                  <Icon className="h-7 w-7 text-accent" />
                </div>
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-bold text-primary sm:text-3xl">{service.title}</h2>
                  <p className="mt-2 font-semibold text-accent-foreground/80">{service.summary}</p>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{service.detail}</p>
                </div>
              </div>

              {details && (
                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      <h3 className="font-bold text-primary">Categories we handle</h3>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {details.categories.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-accent" />
                        <h3 className="text-sm font-bold text-primary">How the process works</h3>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{details.process}</p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-accent" />
                        <h3 className="text-sm font-bold text-primary">Typical lead time</h3>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{details.leadTime}</p>
                    </div>
                  </div>
                </div>
              )}

              {details?.example && (
                <div className="mt-6 rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Example Scenario</p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">{details.example}</p>
                </div>
              )}

              {/* Supporting Images for Specific Services */}
              {service.slug === "oil-and-gas-trade" && (
                <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-primary">Energy sector expertise with compliance</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      From depot allocations to offshore operations, we facilitate petroleum product trading with transparent documentation, quality assurance, and verified supply chains. Our operations ensure compliance with local and international energy standards. Our relationships span refineries, depots, and industrial off-takers across the region, backed by logistics coordination and regulatory adherence.
                    </p>
                  </div>
                  <div className="relative">
                    <img
                      src={oilGasImg}
                      alt="Oil and gas operations"
                      loading="lazy"
                      className="h-64 w-full rounded-2xl object-cover shadow-card lg:h-80"
                    />
                  </div>
                </div>
              )}

              {service.slug === "import-export" && (
                <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-center">
                  <div className="relative lg:order-1">
                    <img
                      src={importExportImg}
                      alt="Import export logistics"
                      loading="lazy"
                      className="h-64 w-full rounded-2xl object-cover shadow-card lg:h-80"
                    />
                  </div>
                  <div className="lg:order-2">
                    <h3 className="text-lg font-bold text-primary">Global logistics with comprehensive documentation</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Whether you're importing machinery, electronics, or industrial equipment from Asia, or exporting agricultural produce to international markets, we coordinate the complete supply chain. Our services include supplier verification, freight booking and forwarding, customs clearing with SONCAP and SON certification, documentation support (Bill of Lading, FORM M), and final delivery coordination to your warehouse. We handle the complexity so you can focus on your business.
                    </p>
                  </div>
                </div>
              )}

              {service.slug === "sourcing-procurement" && (
                <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-primary">Professional procurement with quality assurance</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      We provide tailored procurement solutions for corporate clients, NGOs, government projects, and SMEs. Our services include supplier identification and verification, bulk purchasing with price optimization, negotiation and quality assurance, comprehensive documentation and logistics support, and reliable delivery coordination. We source building materials, industrial equipment, agricultural inputs, and project consumables from vetted suppliers. Every procurement is backed by comparative quotes, transparent payment terms, quality inspection, and documented delivery — ensuring you receive exactly what you ordered, when you need it.
                    </p>
                  </div>
                  <div className="relative">
                    <img
                      src={procurementImg}
                      alt="Procurement and sourcing operations"
                      loading="lazy"
                      className="h-64 w-full rounded-2xl object-cover shadow-card lg:h-80"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* Interactive Trade Enquiry Form */}
      <section id="inquiry-form" className="scroll-mt-20 bg-primary-deep py-16">
        <div className="container-page max-w-3xl">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">Request a quote</h2>
            <p className="mt-2 text-sm text-primary-foreground/75">
              Select the service you need and the form will adapt to collect the right information
            </p>
          </div>

          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {tradeServices.map((service) => {
              const Icon = icons[service.slug] ?? Briefcase;
              return (
                <button
                  key={service.slug}
                  onClick={() => setSelectedService(service.slug)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    selectedService === service.slug
                      ? "bg-accent text-accent-foreground"
                      : "border border-primary-foreground/30 text-primary-foreground hover:border-accent hover:text-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {service.title}
                </button>
              );
            })}
          </div>

          <InquiryForm
            title="Trade enquiry"
            description="Share what you need supplied, sourced or shipped and we will respond with terms."
            intro="Hello Yahaya! I have a trade enquiry."
            fields={getFormFields()}
          />
        </div>
      </section>
    </>
  );
}
