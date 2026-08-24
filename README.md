# Yahaya Duo Brand

# Lovable Build Prompt — Yahaya Travel and Trade Co Ltd

Copy everything below into Lovable as your first prompt.

Note: this assumes the **single-site, two-divisions** approach (Travel and Trade under one brand, clearly separated). If you'd rather split into two fully separate sites, say so and I'll adjust.

---

Build a modern, credible corporate website for **Yahaya Travel and Trade Co Ltd**, a Nigerian company operating two distinct business divisions under one brand: **Travel Services** and **General Contracts / Trade**.

## Brand Identity
- **Company name**: Yahaya Travel and Trade Co Ltd
- **Sub-brand**: "General Contracts" (trade division)
- **RC Number**: 9295358 — display in footer and About page for credibility
- **Logo mark**: stylized flight/swoosh icon paired with "YAHAYA" wordmark
- **Colors**: navy blue and warm gold/orange (matching the physical signage — navy backgrounds, gold/orange accent text and icons), white for contrast and whitespace
- **Typography**: clean, professional sans-serif — this is a B2B/B2C hybrid brand serving both individual travelers and trade/procurement clients, so avoid anything overly playful
- **Tone**: trustworthy, established, efficient — avoid generic stock-agency clichés; lean into "we get things done" (visas processed, cargo moved, deals sourced)

## Site Structure (6 pages)
1. **Home**
2. **Travel Services**
3. **Trade & General Contracts**
4. **About**
5. **Contact**
6. (Optional) **Get a Quote** — shared inquiry form for both divisions

## Homepage Content
- **Hero section**: Headline along the lines of "Your Trusted Partner in Travel and Trade" — subtext referencing both divisions. Two clear CTAs: "Explore Travel Services" and "Explore Trade Services" — this dual-CTA hero is critical since the brand serves two audiences
- **Division split section**: two large, equally-weighted cards/panels immediately below the hero —
  - **Travel** panel (plane icon): Visa Processing, Flight Bookings, Hotel Reservations, Tour Packages, Travel Consultancy — "Explore Travel" button
  - **Trade** panel (ship/cargo icon): Oil and Gas Trade, Import/Export & Wholesalers, Sourcing and Procurement, General Traders, Trade Consultancy — "Explore Trade" button
- **Why Choose Us**: 3–4 short trust points — e.g. registered company (RC 9295358), responsive multi-channel support (phone/WhatsApp/email), end-to-end service handling, established Adamawa-based operation
- **Stats/credibility row** (optional, only if real numbers exist): years in operation, clients served, countries/destinations covered
- **Testimonials**: 2–3 client quotes — separate or mixed between travel and trade clients, clearly labeled which division they relate to
- **Closing CTA banner**: "Ready to get started?" → links to Get a Quote / Contact
- **Footer**: RC number, office address, phone numbers, email, social links (if any), Quick Links nav (both divisions), Privacy Policy / Terms placeholders
- **Floating WhatsApp click-to-chat button** (persistent, bottom-right) pre-filled with a general enquiry message

## Travel Services Page
Full-width sections for each service, each with a short description and relevant iconography:
- **Visa Processing** — end-to-end visa application support and documentation guidance
- **Flight Bookings** — domestic and international flight reservations
- **Hotel Reservations** — accommodation booking for business and leisure travel
- **Tour Packages** — curated travel packages for individuals and groups
- **Travel Consultancy** — personalized travel planning and advisory
Include an inquiry form specific to travel (name, phone, email, service needed, travel dates, destination, message)

## Trade & General Contracts Page
Full-width sections for each service:
- **Oil and Gas Trade** — trading and brokerage within the oil and gas sector
- **Import / Export & Wholesalers** — import-export facilitation and wholesale trade
- **Sourcing and Procurement** — sourcing goods and managing procurement on behalf of clients
- **General Traders** — general trading services across sectors
- **Trade Consultancy** — advisory on trade operations, logistics, and compliance
Include an inquiry form specific to trade (company name, contact name, phone, email, service needed, details of goods/service required, message)

## About Page
- Company history and founding story (placeholder structure — real content to be supplied)
- RC 9295358 registration detail, positioned as a credibility marker
- Explanation of the two divisions and how they complement each other
- Leadership/team section (photo, name, role — placeholder structure)
- Any accreditations (e.g. IATA/NANTA if applicable to the travel arm — flag as "add if applicable")

## Contact Page
- Office address: B.M Yelwa Plaza, Opp. Bachure Junction, Jimeta-Yola, Adamawa State
- Phone numbers: 08063436192, 09127665968, 07015405127
- Email: yahayageneralcontracts@gmail.com (note: recommend upgrading to a custom domain email post-launch, e.g. info@yahayatravelandtrade.com)
- Embedded Google Map for the office location
- General contact form (name, email, phone, division of interest — Travel or Trade, message)
- WhatsApp click-to-chat button
- Business hours

## Functional Requirements
- Fully responsive, mobile-first (primary audience will be on mobile in Nigeria)
- Fast-loading: optimized/compressed images, lazy loading, minimal JS bloat
- Sticky navbar with clear separation between Travel and Trade nav items (e.g. dropdown or two distinct nav groupings) so users self-select their journey immediately
- Functional, validated contact/inquiry forms (both general and division-specific) routing to email and/or WhatsApp
- SEO metadata per page targeting terms like "visa processing Yola," "flight bookings Adamawa," "oil and gas trade Nigeria," "import export Yola," tailored per division page
- Schema.org structured data: `TravelAgency` markup for travel pages, `LocalBusiness` markup site-wide (address, phone, hours)
- WhatsApp deep link format: `https://wa.me/2348063436192?text=Hello%20Yahaya!%20I%20would%20like%20to%20make%20an%20enquiry.`
- Basic analytics integration (GA4 or Plausible) to track which division drives more inquiries

## Design References
Professional, dual-division corporate site — think a hybrid between a boutique travel agency and a trade/logistics firm. Use strong navy + gold contrast from the real signage, generous whitespace, clear iconography per service, and unmistakable visual separation between the Travel and Trade divisions so neither audience feels like an afterthought.

---

*Note: replace placeholder testimonials, team bios, and stats with real company data before launch. Confirm whether IATA/NANTA accreditation exists for the travel division and add if so — this is a strong trust signal for visa/flight services.*

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/75af2ce0-405c-4bf2-adc1-e8ea88b0d8bd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
