/**
 * Brand positioning in one place. Change a desk name or the promise line here and
 * it updates across the header, footer, homepage, interior pages and enquiry flow.
 *
 * TODO(owner): confirm the desk names, the promise line and the response time.
 * These are the defaults proposed in the UI evaluation, not approved copy.
 */
export const brand = {
  promise: "Travel arranged personally, from Yola to anywhere.",
  intro:
    "A private travel desk and a trade and energy desk, run by people you can call by name.",
  /** Shown after an enquiry and on contact routes. Used only if Settings has no value. */
  responseTime: "within one business day",
  desks: {
    travel: {
      name: "Private Travel",
      path: "/travel" as const,
      summary:
        "Hajj and Umrah, family and leisure journeys, business and medical travel, and visas, arranged personally.",
    },
    trade: {
      name: "Trade & Energy",
      path: "/trade" as const,
      summary:
        "Procurement, import and export, and petroleum products for companies, with documentation handled end to end.",
    },
  },
  advisorAction: "Speak to an advisor",
} as const;
