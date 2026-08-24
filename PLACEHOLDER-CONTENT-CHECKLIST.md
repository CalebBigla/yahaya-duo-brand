# Placeholder Content Checklist

This document lists all placeholder content that needs to be replaced with real company data before launch.

## 🏠 Homepage (src/routes/index.tsx)

### Stats Section (Lines 41-46)
**Current placeholders:**
```javascript
const stats = [
  { value: "500+", label: "Clients served" },        // ← REPLACE with real count
  { value: "20+", label: "Destinations covered" },   // ← REPLACE with real count
  { value: "5+", label: "Years in operation" },      // ← REPLACE with actual years
  { value: "3", label: "Support channels" },         // ← This is accurate (phone, WhatsApp, email)
];
```

**Action needed:**
- Count total clients served (travel + trade)
- Count unique destinations you've arranged travel to
- Calculate years since company founding
- Verify support channels count is correct

---

### Testimonials Section (Lines 49-67)
**Current placeholders:**
```javascript
const testimonials = [
  {
    division: "Travel",
    quote: "They handled my visa file...",
    name: "Client name",        // ← REPLACE with real name
    role: "Yola",              // ← REPLACE with real role/location
  },
  // ... 2 more testimonials
];
```

**Action needed:**
- Contact 3 satisfied clients (1-2 travel, 1-2 trade)
- Get permission to use their names and quotes
- Request specific feedback about:
  - What problem you solved
  - What impressed them about the service
  - Concrete details (visa approved, delivery on time, etc.)
- Include their role/company or location
- Keep quotes authentic and specific (avoid generic praise)

---

## ✈️ Travel Page (src/routes/travel.tsx)

### Visa Timelines
**Lines 78-121: Verify these timelines are current**
- UK visitor visa: 3 weeks average
- Schengen visa: 15 working days
- US visa: 2-8 weeks
- Canada visa: 4-6 weeks
- UAE (Dubai): 3-5 working days
- Saudi Arabia: Variable by season

**Action needed:**
- Check embassy websites for current processing times
- Update if timelines have changed
- Add disclaimer if timelines are highly variable

---

### Service Examples
**Lines 52-119: Review example scenarios for accuracy**

Each service has an example (Visa Processing, Flight Bookings, etc.)

**Action needed:**
- Confirm examples reflect typical client cases
- Update with more recent or realistic scenarios if needed
- Verify pricing/timeline claims are accurate

---

## 🚢 Trade Page (src/routes/trade.tsx)

### Lead Times
**Lines 48-114: Verify these lead times match current operations**

Examples:
- Oil & Gas: 3-5 days (small), 1-2 weeks (large)
- Import/Export: 4-8 weeks import, 2-4 weeks export
- Sourcing: 1-2 weeks (local), 4-8 weeks (international)

**Action needed:**
- Review with operations team
- Update if actual lead times differ
- Add notes for seasonal variations if applicable

---

### Service Examples
**Lines 48-114: Review example scenarios**

Examples include:
- 10,000L AGO delivery to Yola
- 2 containers building materials from China
- 500 bags cement to Mubi
- 100 tonnes maize harvest procurement

**Action needed:**
- Confirm these are realistic transaction sizes
- Update with recent successful projects if better examples exist
- Verify pricing structures described are accurate

---

## 📖 About Page (src/routes/about.tsx)

### Timeline / Milestones (Lines 13-30)
**CRITICAL: All years marked as "20XX"**

```javascript
const milestones = [
  {
    year: "20XX",  // ← REPLACE with real year
    title: "Company founded",
    description: "Yahaya Travel and Trade Co Ltd established...",
  },
  {
    year: "20XX",  // ← REPLACE with RC registration year
    title: "RC registration confirmed",
    description: "Incorporated as RC 9295358...",
  },
  {
    year: "20XX",  // ← REPLACE with expansion year
    title: "Trade division expansion",
    description: "Expanded into oil and gas trade...",
  },
  {
    year: "20XX",  // ← REPLACE with office opening year
    title: "Office establishment",
    description: "Opened at B.M Yelwa Plaza...",
  },
];
```

**Action needed:**
- Find company founding date (registration paperwork)
- RC registration date (should be on certificate)
- When trade division was added (if after founding)
- When current office location opened
- Add additional milestones if significant (staff growth, major contracts, etc.)

---

### Team Section (Lines 5-11)
**Current placeholders:**
```javascript
const team = [
  { name: "Team member name", role: "Managing Director", initials: "MD" },
  { name: "Team member name", role: "Head, Travel Services", initials: "TS" },
  { name: "Team member name", role: "Head, Trade & Contracts", initials: "TC" },
];
```

**Action needed:**
- Replace with real names and titles
- Take professional headshot photos (or use initials placeholder)
- Consider adding brief bios (1-2 sentences per person)
- Add more team members if appropriate (operations, logistics, client services)

---

### IATA/NANTA Accreditation
**Line with comment: "ADD IF APPLICABLE"**

**Action needed:**
- Verify if company has IATA membership (International Air Transport Association)
- Verify if company has NANTA membership (National Association of Nigeria Travel Agencies)
- If yes to either:
  - Add accreditation logo/badge
  - Add membership number
  - Note what it means for clients (verified agent, access to systems, etc.)
- If no:
  - Remove this placeholder section
  - OR add "Working towards IATA certification" if in progress

---

## 📞 Contact Page (src/routes/contact.tsx)

### Contact Information Verification
**No placeholders, but verify these are current:**

- Office address: B.M Yelwa Plaza, Opp. Bachure Junction, Jimeta-Yola, Adamawa State
- Phone numbers: 08063436192, 09127665968, 07015405127
- Email: yahayageneralcontracts@gmail.com
- WhatsApp: 2348063436192
- Business hours:
  - Monday-Friday: 8:00 AM - 6:00 PM
  - Saturday: 9:00 AM - 4:00 PM
  - Sunday: Closed

**Action needed:**
- Confirm all phone numbers are active and monitored
- Test WhatsApp number responds
- Verify business hours are accurate
- Consider upgrading email to custom domain (e.g., info@yahayatravelandtrade.com)

---

## 🎯 Content Quality Checklist

Before considering content "complete," verify:

### Accuracy
- [ ] All timelines reflect current processing times
- [ ] All pricing structures described are accurate
- [ ] All example scenarios are realistic
- [ ] All contact information works

### Authenticity
- [ ] Testimonials are from real clients with permission
- [ ] Stats are actual company metrics, not estimates
- [ ] Timeline dates are factually correct
- [ ] Team bios are accurate and current

### Completeness
- [ ] No placeholder text remains (search for "placeholder", "REPLACE", "20XX")
- [ ] All "TBD" or "Coming soon" sections are resolved
- [ ] All flagged comments have been addressed
- [ ] All examples include sufficient detail

### Compliance
- [ ] Client testimonials have written permission for publication
- [ ] No claims that cannot be substantiated
- [ ] All regulatory/licensing claims are accurate
- [ ] All timelines include appropriate disclaimers

---

## 🔍 Search Commands to Find Remaining Placeholders

Run these searches in your code editor before launch:

- Search for: `PLACEHOLDER`
- Search for: `20XX`
- Search for: `Client name`
- Search for: `Team member name`
- Search for: `REPLACE`
- Search for: `TBD`
- Search for: `ADD IF APPLICABLE`

---

## 📝 Quick Replacement Priority

**High Priority (Launch Blockers):**
1. ✅ Timeline years in About page
2. ✅ Team names and roles in About page
3. ✅ Testimonials (real names and quotes)
4. ✅ Stats (real numbers)

**Medium Priority (Improve Before Launch):**
5. ⚠️ Verify all timelines are current
6. ⚠️ Review all example scenarios for accuracy
7. ⚠️ IATA/NANTA accreditation status

**Low Priority (Can Update Post-Launch):**
8. 📌 Additional team member bios
9. 📌 More detailed service examples
10. 📌 Additional FAQs based on real client questions

---

## ✅ Launch Readiness Test

Before going live, one person should:

1. Read every page as if they're a potential client
2. Mark any text that feels vague, generic, or placeholder-like
3. Verify every claim can be backed up with evidence
4. Test every interactive element (accordions, tabs, forms)
5. Submit a test enquiry through each form
6. Call/WhatsApp all listed numbers
7. Verify Google Maps shows correct location

If you can complete this test without finding placeholder content or broken features, you're ready to launch.

---

**Document created:** 2026-08-18  
**Review this checklist before launch and mark items complete as you replace placeholder content.**
