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

// Expanded service details with categories, process, lead times, and examples
const serviceDetails = {
  "oil-and-gas-trade": {
    categories: [
      "Petroleum products (PMS, AGO, DPK)",
      "Crude oil brokerage and facilitation",
      "LPG (cooking gas) supply",
      "Lubricants and industrial oils",
      "Trading relationships with refineries and depots",
    ],
    process: "You specify product type, volume, delivery location, and timeline. We identify vetted suppliers or off-takers, negotiate pricing aligned with current market rates, coordinate quality inspections where needed, handle documentation (purchase orders, PPPRA licenses if applicable, delivery notes), and track delivery to your designated location or depot.",
    leadTime: "Depends on product and volume. Small volumes (trucks) can be arranged within 3-5 days. Large consignments (multiple trucks or depot allocations) require 1-2 weeks for supply coordination and documentation.",
    example: "Need 10,000 liters of AGO delivered to your construction site in Yola? We source from a verified depot, provide a transparent quote (product cost + logistics + our margin), coordinate the delivery trucks, ensure the product meets specs, and provide all documentation for your records and accounting.",
  },
  "import-export": {
    categories: [
      "Import of machinery, equipment, and spare parts",
      "Export of agricultural produce (grains, sesame, ginger, hibiscus)",
      "Wholesale distribution into Adamawa and North East markets",
      "Customs clearing and freight forwarding coordination",
      "Documentation: Bill of Lading, FORM M, SONCAP, others as required",
    ],
    process: "Tell us what you want to import (or export) and the destination. We identify reliable suppliers (or buyers), provide FOB/CIF pricing, coordinate shipping and clearing, manage customs documentation, and arrange final delivery to your warehouse or designated location. For exports, we handle quality inspection, packaging, and shipping coordination.",
    leadTime: "Import lead times: 4-8 weeks depending on origin country and shipping method (sea vs. air). Clearing at Nigerian ports typically adds 1-2 weeks. Export arrangements: 2-4 weeks from order to shipment, depending on product availability and buyer requirements.",
    example: "Importing 2 containers of building materials from China? We source the supplier, negotiate pricing, arrange shipping to Lagos (Apapa or Tin Can), handle customs clearing and SONCAP certification, and coordinate haulage to your warehouse in Yola — with transparent itemized costs at every stage.",
  },
  "sourcing-procurement": {
    categories: [
      "Building materials (cement, iron rods, roofing sheets, tiles)",
      "Agricultural inputs (fertilizer, seeds, pesticides)",
      "Office and industrial equipment",
      "Consumables and supplies for businesses and projects",
      "Vendor verification and due diligence",
    ],
    process: "You provide product specifications, quantity, quality requirements, and delivery timeline. We identify 2-3 vetted suppliers, present comparative quotes with our recommendation, coordinate payment terms (we can facilitate escrow or milestone payments), manage logistics, inspect goods before delivery where feasible, and provide all documentation (invoices, waybills, delivery confirmations).",
    leadTime: "Local sourcing (Nigerian suppliers): 1-2 weeks for most products. International sourcing: 4-8 weeks depending on origin and shipping. Urgent requests can be fast-tracked where suppliers allow, but may carry premium costs.",
    example: "Need 500 bags of cement delivered to a project site in Mubi? We source from verified dealers, negotiate bulk rates, arrange haulage, confirm delivery to site, and provide the invoice and waybill. For recurring needs, we set up a supply schedule so cement arrives as your project progresses.",
  },
  "general-traders": {
    categories: [
      "Grains and food commodities (rice, maize, millet, beans)",
      "Construction materials at wholesale volumes",
      "Consumer goods and retail supplies",
      "Seasonal and bulk trading (harvest procurement, festive stock)",
      "Cross-border trade facilitation within West Africa",
    ],
    process: "We buy and sell goods at volume, either on our own account or as intermediaries connecting buyers and sellers. Pricing is transparent and negotiable based on volume, payment terms, and delivery requirements. We handle logistics, quality assurance, and documentation to ensure smooth transactions.",
    leadTime: "Depends on product and market conditions. Commodity trades (grains, materials) can close within days if stock is available. Seasonal procurement (e.g., harvest-time buying) requires advance planning and commitment.",
    example: "Looking to buy 100 tonnes of maize during harvest season? We coordinate with farmers or aggregators, arrange quality inspection, provide warehousing if needed, and deliver to your mill or storage facility at an agreed schedule. Alternatively, if you're a farmer with produce to sell, we connect you with vetted buyers and manage the transaction.",
  },
  "trade-consultancy": {
    categories: [
      "Import/export documentation and compliance guidance",
      "Duty and tariff calculation for imports",
      "Logistics routing (sea, air, or land freight options)",
      "Supplier verification and due diligence",
      "Trade finance and payment structure advice",
    ],
    process: "You describe your trade challenge or question — we provide specific advice, documentation templates, regulatory guidance, or connect you with the right service providers (clearing agents, freight forwarders, banks). Consultancy can be one-off (single question) or ongoing (retained advisory for a business).",
    leadTime: "Immediate responses for straightforward queries. For complex advisory (e.g., setting up an import operation or evaluating a cross-border trade deal), we schedule a detailed consultation within 2-3 business days.",
    example: "Planning to start importing electronics from Dubai but unsure of the documentation and duties? We walk you through FORM M requirements, calculate estimated customs duties and levies, advise on SONCAP certification, recommend clearing agents in Lagos, and provide a step-by-step checklist so you know what to expect before you commit.",
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
                Trade & General Contracts
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-primary-foreground/85">
                Oil and gas trading, import and export facilitation, sourcing and procurement — delivered with documentation handled and timelines respected.
              </p>
            </div>
          </div>
        </div>
      </section>

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
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Verified suppliers and transparent pricing
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Logistics, clearing and documentation coordinated
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Registered company, RC 9295358 — contract-ready
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
                    <h3 className="text-lg font-bold text-primary">Energy sector expertise</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      From depot allocations to offshore operations, we facilitate petroleum product trading with transparent documentation and verified supply chains. Our relationships span refineries, depots, and industrial off-takers across the region.
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
                    <h3 className="text-lg font-bold text-primary">Global logistics, local accountability</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Whether you're importing machinery from Asia or exporting agricultural produce to international markets, we coordinate the complete supply chain — from supplier verification and freight booking to customs clearing and final delivery to your warehouse.
                    </p>
                  </div>
                </div>
              )}

              {service.slug === "sourcing-procurement" && (
                <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-primary">Verified suppliers, transparent terms</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      We source building materials, industrial equipment, agricultural inputs, and project consumables from vetted suppliers. Every procurement is backed by comparative quotes, clear payment terms, and documented delivery — so you know exactly what you're getting and when.
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
