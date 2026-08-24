# Yahaya Travel and Trade Co Ltd — Corporate Website

A six-page, mobile-first corporate site with two clearly separated divisions (Travel Services and Trade & General Contracts) under one navy-and-gold brand. All inquiry forms route to WhatsApp with a pre-filled, validated message — no backend needed.

## Pages

1. **Home** — dual-CTA hero ("Your Trusted Partner in Travel and Trade"), two equally weighted division panels (plane / cargo ship icons with the five services each), Why Choose Us trust points (RC 9295358, multi-channel support, end-to-end handling, Adamawa-based), a stats row and 2–3 labelled testimonials (placeholder, marked for replacement), closing "Ready to get started?" CTA banner.
2. **Travel Services** — full-width section per service: Visa Processing, Flight Bookings, Hotel Reservations, Tour Packages, Travel Consultancy. Travel inquiry form (name, phone, email, service, travel dates, destination, message).
3. **Trade & General Contracts** — full-width section per service: Oil and Gas Trade, Import/Export & Wholesalers, Sourcing and Procurement, General Traders, Trade Consultancy. Trade inquiry form (company, contact name, phone, email, service, goods/service details, message).
4. **About** — founding story (placeholder), RC 9295358 as credibility marker, how the two divisions complement each other, leadership cards (placeholder photos/names/roles), an accreditation block flagged "add IATA/NANTA if applicable".
5. **Contact** — office address (B.M Yelwa Plaza, Opp. Bachure Junction, Jimeta-Yola, Adamawa State), the three phone numbers, email, business hours, embedded Google Map, general contact form with a Travel/Trade division selector, WhatsApp button.
6. **Get a Quote** — shared inquiry form covering both divisions (division selector switches the relevant extra fields).

Sitewide: sticky navbar with Travel and Trade as visually distinct nav groups, footer with RC number, address, phones, email, quick links for both divisions, and Privacy Policy / Terms placeholder pages, plus a persistent floating WhatsApp button.

## Design

- Navy base with warm gold/orange accents and generous white space, matching the physical signage.
- Clean professional sans-serif, no playful styling; Travel sections lean lighter/airier, Trade sections darker/heavier so the two divisions are unmistakable.
- Custom "YAHAYA" wordmark with a flight swoosh mark; per-service line icons.
- Hero and division imagery generated as optimized assets, lazy-loaded below the fold.

## Technical notes

- Colors, gradients and shadows defined as semantic tokens in `src/styles.css`; no hardcoded color utilities.
- One route file per page under `src/routes/`, each with its own `head()`: unique title, description, og/twitter tags targeting "visa processing Yola", "flight bookings Adamawa", "oil and gas trade Nigeria", "import export Yola".
- JSON-LD via route `scripts`: `LocalBusiness` (address, phones, hours) on the root, `TravelAgency` on the travel page.
- Forms validated with zod + react-hook-form; on submit, values are `encodeURIComponent`-encoded into `https://wa.me/2348063436192?text=...` and opened in a new tab. Length limits on every field, no console logging of submissions.
- Placeholder testimonials, stats, and team bios marked in code with clear comments for pre-launch replacement.

## Not included

Analytics (skipped for now), email/database storage of submissions, and real company content beyond the details supplied.
