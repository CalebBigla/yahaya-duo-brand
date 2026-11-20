/**
 * Editorial content for the public site that is not (yet) in the CMS.
 *
 * Rule: nothing here may be invented. Facts come from the existing site copy; where
 * the business must supply something, the field is empty and the section that uses
 * it stays hidden until it is filled. Each such field is marked TODO(owner).
 */

export const founder = {
  name: "Yahaya Muhammad Umar",
  role: "Founder and Chief Executive Officer",
  /** From the existing About page biography. */
  bio: [
    "Yahaya is a Nigerian civil servant and businessman whose career joins public-sector discipline with private enterprise. Years inside government systems gave him a working knowledge of regulation, compliance and institutional process, and that knowledge now shapes how the company operates.",
    "He founded the company to connect people, products and opportunities across borders, with hands-on experience in trade, procurement and travel facilitation. He insists on transparent processes, client-centred service and long-term value.",
  ],
  /** One-line summary for the homepage, drawn from the biography above. */
  summary:
    "A career in public service taught him regulation, compliance and process. He founded the company to connect people, products and opportunities across borders, and to do it transparently.",
  /**
   * TODO(owner): a short note in the founder's own words (two or three sentences).
   * The homepage shows it as a quote only when this is filled in.
   */
  quote: "",
};

/**
 * Signature journeys on the homepage. No prices.
 * TODO(owner): confirm these are journeys the desk actively arranges, and edit the
 * one-line descriptions. Destinations come from the existing site copy.
 */
export const signatureJourneys = [
  {
    key: "umrah",
    title: "VIP Umrah",
    description: "Visas, flights and hotels for Makkah and Madinah, arranged around your family's dates.",
    image: "journeyUmrah",
  },
  {
    key: "dubai",
    title: "A family stay in Dubai",
    description: "Hotels, transfers and days out planned around the people travelling.",
    image: "journeyDubai",
  },
  {
    key: "istanbul",
    title: "Istanbul on business",
    description: "Visas, flights and a well-placed hotel for meetings, with time to see the city.",
    image: "journeyIstanbul",
  },
] as const;

/**
 * "How we work" steps.
 * TODO(owner): confirm this matches how enquiries are actually handled, especially
 * that each client keeps one advisor from first call to return.
 */
export const howWeWork = [
  {
    title: "A conversation with an advisor",
    body: "Tell us where, when and who. One advisor takes your enquiry and stays with it.",
  },
  {
    title: "A proposal shaped to you",
    body: "We come back with options and clear terms, in writing, before anything is booked or ordered.",
  },
  {
    title: "Handled end to end",
    body: "Visas, bookings, documents and delivery are managed for you, with updates at each step.",
  },
] as const;

export const discretionPromise = "Your plans and documents are handled privately and shared only with the people who need them.";

/**
 * Memberships, licences and partners actually held. Shown only when non-empty.
 * TODO(owner): add only what can be verified (e.g. an association membership number).
 */
export const credentials: Array<{ name: string; detail?: string; url?: string }> = [];

/** Public register where visitors can verify the company's registration. */
export const registryUrl = "https://search.cac.gov.ng/home";
