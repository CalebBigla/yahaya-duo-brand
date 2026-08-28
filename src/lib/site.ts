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
  email: "yahayatraveltradecoltd@yahoo.com",
  hours: [
    { days: "Monday – Friday", time: "8:00 AM – 6:00 PM" },
    { days: "Saturday", time: "9:00 AM – 4:00 PM" },
    { days: "Sunday", time: "Closed" },
  ],
  mapQuery: "B.M+Yelwa+Plaza,+Bachure+Junction,+Jimeta-Yola,+Adamawa+State,+Nigeria",
} as const;

export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const generalWhatsapp = whatsappLink(
  "Hello Yahaya! I would like to make an enquiry.",
);

export const travelServices = [
  {
    slug: "visa-processing",
    title: "Visa Processing",
    summary: "End-to-end visa application support and documentation guidance.",
    detail:
      "We handle the paperwork from first checklist to submission: eligibility review, document preparation, appointment booking and follow-up, for tourist, business, study and pilgrimage visas.",
  },
  {
    slug: "flight-bookings",
    title: "Flight Bookings",
    summary: "Domestic and international flight reservations.",
    detail:
      "Fare comparisons across major carriers, ticketing, date changes and rebooking, for one-off trips or recurring corporate travel out of Yola, Abuja and Lagos.",
  },
  {
    slug: "hotel-reservations",
    title: "Hotel Reservations",
    summary: "Accommodation booking for business and leisure travel.",
    detail:
      "Vetted hotels and serviced apartments at negotiated rates, matched to your budget, location and length of stay, with confirmations you can present at check-in or for a visa file.",
  },
  {
    slug: "tour-packages",
    title: "Tour Packages",
    summary: "Curated travel packages for individuals and groups.",
    detail:
      "Fully arranged itineraries covering flights, transfers, accommodation and guided activities, for families, corporate retreats and group pilgrimages.",
  },
  {
    slug: "travel-consultancy",
    title: "Travel Consultancy",
    summary: "Personalized travel planning and advisory.",
    detail:
      "Route planning, entry requirements, travel insurance and cost optimisation advice, so you know exactly what a trip demands before you commit to it.",
  },
] as const;

export const tradeServices = [
  {
    slug: "oil-and-gas-trade",
    title: "Oil and Gas Trade",
    summary: "Trading and brokerage within the oil and gas sector.",
    detail:
      "Buyer and seller introductions, deal structuring support and coordination of documentation for petroleum product transactions.",
  },
  {
    slug: "import-export",
    title: "Import and Export Wholesalers",
    summary: "Import-export facilitation and wholesale trade.",
    detail:
      "Supplier identification, shipping and clearing coordination, and wholesale supply of goods into Adamawa and the wider North East.",
  },
  {
    slug: "sourcing-procurement",
    title: "Sourcing and Procurement",
    summary: "Sourcing goods and managing procurement on behalf of clients.",
    detail:
      "We find the supplier, verify them, negotiate the price and manage delivery, for one-off purchases or scheduled contract supply.",
  },
  {
    slug: "general-traders",
    title: "General Traders",
    summary: "General trading services across sectors.",
    detail:
      "Building materials, agricultural produce, equipment and consumables, bought and sold at volume with transparent pricing.",
  },
  {
    slug: "trade-consultancy",
    title: "Trade Consultancy",
    summary: "Advisory on trade operations, logistics, and compliance.",
    detail:
      "Guidance on documentation, duties, logistics routing and regulatory compliance so shipments and contracts move without avoidable delay.",
  },
] as const;
