# Homepage Restructure Summary

## Overview
The homepage has been restructured to prioritize **Oil & Gas Distribution** and **Sourcing & Procurement** as the primary business focus, with Travels & Tours positioned as a secondary supporting service.

---

## Key Changes

### 1. **Hero Section** (Top of Page)
- **New headline**: "Powering energy and supply chains across Nigeria"
- **New imagery**: Oil & gas and petroleum engineering visuals (replacing travel imagery)
- **Updated CTAs**: 
  - Primary: "Oil & Gas Services"
  - Secondary: "Sourcing & Procurement"
- **Updated description**: Focuses on energy distribution, supply chains, and industrial operations

### 2. **Core Objectives Section** (Directly Below Hero)
- **Two large featured cards** with maximum visual weight:
  - **Oil & Gas Distribution**: Petroleum products trading, filling stations, energy logistics
  - **Sourcing & Procurement**: Vendor verification, logistics, quality assurance
- Each card includes:
  - Large imagery (16:10 aspect ratio)
  - Icon (Ship for Oil & Gas, Workflow for Sourcing)
  - Detailed description
  - Direct CTA to respective service pages

### 3. **Filling Stations Network Map** (Early/Mid-Page)
- **Placeholder station network** showing 6 locations across Nigeria:
  - Abuja Central (Operational)
  - Jimeta-Yola (Operational)
  - Lagos Mainland (Operational)
  - Kano City (Operational)
  - Port Harcourt (Operational)
  - Kaduna (Coming Soon)
- Each station card shows:
  - Station name and region
  - Operational status
  - Services offered (Petrol, Diesel, Lubricants)
- Reinforces the scale of oil & gas operations

### 4. **Sourcing & Procurement Highlight** (Mid-Page)
- **Dedicated section** showcasing the complete procurement process:
  - Step 1: Supplier Verification
  - Step 2: Price Negotiation & PO Management
  - Step 3: Logistics & Quality Assurance
- Large imagery and detailed process explanation
- Direct CTA to procurement services page

### 5. **Travels & Tours** (Lower Down, Compact Format)
- **Reduced to a single compact section** with:
  - Smaller heading (2xl vs 4xl for main sections)
  - Tagged as "Supporting Service"
  - One image (reduced from 4 hotel cards)
  - Brief description with 3 key bullet points
  - Simple text link CTA (not a prominent button)
- Positioned **after** core Oil & Gas and Sourcing sections

### 6. **Full-Width Banner** (Mid-Page)
- **Updated messaging**: "From upstream supply to downstream delivery"
- Focuses on energy and procurement supply chains (removed travel references)

### 7. **Stats Section** (Mid-Page)
- **New headline**: "Built for scale and reliability"
- **Updated imagery**: Industrial/offshore operations (replacing lifestyle travel photo)
- Description emphasizes infrastructure for fueling fleets and sourcing equipment

### 8. **How It Works Section** (Mid-Page)
- **Defaults to "Trade Journey"** (was previously "Travel Journey")
- Tab order switched: Trade first, Travel second

### 9. **Key Features Section** (Mid-Page)
- **New headline**: "Why businesses trust our supply chain"
- All feature descriptions updated to focus on:
  - Purchase orders and delivery documentation
  - Multi-vendor procurement coordination
  - Supplier and freight forwarder verification
  - Corporate client relationships

### 10. **Explore Services Section** (Lower Page)
- Reordered to prioritize:
  1. Oil & Gas (Energy Trading)
  2. Sourcing & Procurement (Supply Chain)
  3. Import/Export (Logistics & Trade)
  4. Travel Services (Visas & Flights) - last position

### 11. **Closing CTA** (Bottom of Page)
- **Updated headline**: "Ready to streamline your supply chain?"
- Description mentions fuel distribution and procurement first, travel last

---

## Visual Hierarchy Changes

### Before:
```
Hero (Travel focus) → 4-card Bento (2 Travel, 2 Trade) → Hotel Partners (4 cards) 
→ Trade Gallery (4 cards) → Banner → Stats → How It Works (Travel default) 
→ Features (Both divisions equal) → Categories → Testimonials → FAQ → CTA
```

### After:
```
Hero (Oil & Gas focus) → Core Objectives (2 large: Oil & Gas + Sourcing) 
→ Filling Stations Map (6 locations) → Sourcing Highlight (Dedicated section)
→ Travels & Tours (Compact, 1 section) → Banner (Supply chain focus) 
→ Stats (Industrial focus) → How It Works (Trade default) 
→ Features (Supply chain focus) → Trust Section → Categories (Trade priority)
→ Testimonials → FAQ → CTA (Supply chain focus)
```

---

## Meta & SEO Updates

- **Title**: Updated to "Oil & Gas, Sourcing & Procurement Services"
- **Description**: Prioritizes oil/gas, filling stations, sourcing before mentioning travel

---

## Technical Details

- File modified: `src/routes/index.tsx`
- Images reordered: Industrial/energy images now in hero and early sections
- State default changed: `activeJourney` now defaults to `"trade"` instead of `"travel"`
- All existing functionality preserved (animations, interactivity, responsive design)

---

## Result

The homepage now clearly positions Yahaya Travel and Trade Co Ltd as primarily an **energy distribution and supply chain company** with filling station operations and procurement services at the forefront, while maintaining travel services as a valuable but secondary offering for corporate clients.
