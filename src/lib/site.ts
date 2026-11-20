export const site = {
  name: "Yahaya Travel and Trade Co Ltd",
  shortName: "Yahaya",
  subBrand: "General Contracts",
  rcNumber: "9295358",
  address: {
    street: "B.M Yelwa Plaza, Opp. Bachure Junction",
    locality: "Jimeta-Yola",
    region: "Adamawa State",
    country: "Nigeria",
  },
  addressLine: "B.M Yelwa Plaza, Opp. Bachure Junction, Jimeta-Yola, Adamawa State",
  phones: ["+234 806 343 6192"],
  whatsappNumber: "2349127650968",
  email: "yahayageneralcontracts@gmail.com",
  /**
   * Opening hours: the single source for the footer, the contact page and the
   * LocalBusiness structured data (unless Settings provides business_hours).
   * TODO(owner): confirm Sunday. The site has shown Sunday 9:00 AM – 4:00 PM while
   * the structured data said closed; both now follow this list.
   */
  hours: [
    { days: "Monday – Friday", time: "8:00 AM – 6:00 PM", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "18:00" },
    { days: "Saturday", time: "9:00 AM – 4:00 PM", dayOfWeek: ["Saturday"], opens: "09:00", closes: "16:00" },
    { days: "Sunday", time: "9:00 AM – 4:00 PM", dayOfWeek: ["Sunday"], opens: "09:00", closes: "16:00" },
  ],
  mapQuery: "B.M+Yelwa+Plaza,+Bachure+Junction,+Jimeta-Yola,+Adamawa+State,+Nigeria",
} as const;

/** "+234 806 343 6192" or "0806 343 6192" -> "+2348063436192" for tel: links and structured data. */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  return `+${digits}`;
}

export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const generalWhatsapp = whatsappLink(
  "Hello Yahaya! I would like to make an enquiry.",
);

export const travelServices = [
  {
    slug: "visa-processing",
    title: "Visa Processing Services",
    summary: "Expert guidance and application support for all visa types.",
    detail:
      "We provide expert guidance and application support for tourist, business, study, work, and residency visas. Our services include document review and advisory, application processing, appointment scheduling, interview preparation, and compliance and travel advisories.",
  },
  {
    slug: "flight-bookings",
    title: "Flight Bookings",
    summary: "Assistance with local and international flight arrangements.",
    detail:
      "We assist clients with local and international flight bookings, corporate travel arrangements, flexible fare options, and emergency and last-minute travel assistance for one-off trips or recurring corporate travel needs.",
  },
  {
    slug: "hotel-reservations",
    title: "Hotel Reservations",
    summary: "Assistance with hotel bookings suited to your travel needs.",
    detail:
      "We assist with hotel reservations worldwide, offering budget to luxury accommodation options and long-stay and seasonal discount coordination, matched to your budget, location, and length of stay.",
  },
  {
    slug: "tour-packages",
    title: "Tour Packages",
    summary: "Personalized and group tour packages for all occasions.",
    detail:
      "Personalized and group tour packages designed for holidays and vacations, study trips, honeymoon packages, adventure and cultural experiences, and corporate retreats with fully arranged itineraries covering flights, transfers, accommodation, and guided activities.",
  },
  {
    slug: "travel-consultancy",
    title: "Travel Consultancy",
    summary: "Expert guidance for seamless travel planning.",
    detail:
      "Our experts offer itinerary planning, immigration and travel compliance guidance, country-specific travel analysis, and risk assessment and travel insurance support, so you know exactly what a trip demands before you commit to it.",
  },
] as const;

export const tradeServices = [
  {
    slug: "oil-and-gas-trade",
    title: "Oil and Gas Trade",
    summary: "Supply of petroleum products with compliance and quality assurance.",
    detail:
      "Supply of petroleum products, trading of crude and refined products, logistics coordination, and compliance with local and international energy standards.",
  },
  {
    slug: "import-export",
    title: "Import and Export Wholesalers",
    summary: "Comprehensive import-export facilitation with full documentation.",
    detail:
      "We connect suppliers across the globe, manage international shipping, customs clearing, SONCAP and SON certification, freight forwarding, and deliver wholesale goods to markets worldwide with complete documentation support.",
  },
  {
    slug: "sourcing-procurement",
    title: "Sourcing and Procurement",
    summary: "Professional procurement with supplier verification and quality assurance.",
    detail:
      "Tailored procurement solutions for corporate clients, NGOs, government projects, and SMEs. We provide supplier identification and verification, bulk purchasing with price optimization, quality assurance, and comprehensive documentation and logistics support.",
  },
  {
    slug: "general-traders",
    title: "General Traders",
    summary: "Multisector trading hub dealing in manufactured and agricultural goods.",
    detail:
      "Operating as a multisector trading hub, we handle manufactured goods, agricultural products, consumer goods, industrial materials, building materials, and specialized equipment, bought and sold at volume with transparent pricing.",
  },
  {
    slug: "trade-consultancy",
    title: "Trade Consultancy",
    summary: "Feasibility studies, market entry strategies, and compliance advisory.",
    detail:
      "We support individuals and companies seeking to expand into international markets through feasibility studies, market entry strategies, supplier verification and due diligence, regulatory and compliance advisory, and trade finance guidance.",
  },
] as const;
