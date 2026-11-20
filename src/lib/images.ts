/**
 * Image slots for the public site.
 *
 * Pages ask for a slot by name (e.g. images.homeHero) instead of importing files,
 * so replacing a photo is a one-line change here.
 *
 * Every slot below except the founder portrait is a TEMPORARY PLACEHOLDER: the files
 * are 735-1200 px wide downloads (most are the standard size of Pinterest
 * downloads) and several are named after other businesses, so usage rights are
 * unknown. TODO(owner): replace each with licensed or commissioned photography at
 * 2400 px or more on the long edge. Put originals in src/assets/photos/ and run
 * `npm run images` (see src/assets/photos/README.md); then point the slot at the
 * generated entry from src/assets/photos/generated.
 */
import type { ResponsiveSource } from "@/components/site/ResponsiveImage";

import founder from "@/assets/YAHAYA.webp";
import travelWide from "@/assets/travel.webp";
import tradeWide from "@/assets/trade.webp";
import travelPortrait from "@/assets/Minimalist Travel Aesthetic _ Manifesting My Next Journey 🌍✨.webp";
import cargoPortrait from "@/assets/download (25).webp";
import saudi from "@/assets/Saudi Arabia beauty.webp";
import dubai from "@/assets/Dubai.webp";
import turkey from "@/assets/Turkey.webp";
import egypt from "@/assets/Egypt.webp";
import oilField from "@/assets/petroleum engineering.webp";
import logisticsWide from "@/assets/Vietnam needs to nurture efficient logistics sector, adapt modern tech.webp";

const placeholder = (src: string, width: number, height: number, alt: string): ResponsiveSource => ({
  fallback: src,
  width,
  height,
  alt,
  placeholder: true,
});

export const images = {
  /** Real photo of the founder (1086x1448). Not a placeholder. */
  founder: { fallback: founder, width: 1086, height: 1448, alt: "Founder of Yahaya Travel and Trade", placeholder: false },

  // Wide slots (heroes). Need 2400px+ landscape originals.
  homeHero: placeholder(travelWide, 1200, 912, "Traveller's view from an aircraft window"),
  travelHero: placeholder(travelWide, 1200, 912, "Traveller's view from an aircraft window"),
  tradeHero: placeholder(tradeWide, 1200, 900, "Cargo containers at a port"),
  logistics: placeholder(logisticsWide, 736, 488, "Container ship and trucks at a port"),

  // Portrait slots (mobile hero crops and 4:5 editorial cards). Need 2400px+ portrait originals.
  homeHeroMobile: placeholder(travelPortrait, 736, 1104, "Aircraft window seat with passport and boarding pass"),
  deskTravel: placeholder(travelPortrait, 736, 1104, "Aircraft window seat with passport and boarding pass"),
  deskTrade: placeholder(cargoPortrait, 736, 1104, "Port cranes and cargo at sunset"),
  energy: placeholder(oilField, 736, 736, "Petroleum engineering site"),

  // Signature journeys.
  journeyUmrah: placeholder(saudi, 736, 1308, "Saudi Arabia"),
  journeyDubai: placeholder(dubai, 736, 736, "Dubai skyline"),
  journeyIstanbul: placeholder(turkey, 735, 919, "Istanbul, Turkey"),
  journeyEgypt: placeholder(egypt, 736, 1104, "Egypt"),
} satisfies Record<string, ResponsiveSource>;

/**
 * Files in src/assets whose name or size suggests they were downloaded from
 * Pinterest or name another business. Listed so they can be replaced first.
 */
export const imagesToReplace = [
  "Best Logistics Companies in India – Top Supply Chain Solutions for Business Growth 2026",
  "Import export training in karachi lahore islamabad pakistan",
  "Best Hotel Room in Jaipur",
  "Akasha Beach Hotel",
  "Borges 2129 I by depptö",
  "Vietnam needs to nurture efficient logistics sector, adapt modern tech",
  "Minimalist Travel Aesthetic _ Manifesting My Next Journey",
  "Day Trips from Los Cabos",
  "24 Small Guest Room Ideas for Compact Comfort and___",
  "download (23), download (24), download (25), download (27)",
  "Chinese beauty, qatar beuty, Saudi Arabia beauty, Dubai, Egypt, Turkey (736px downloads)",
  "Off shore rig worker, petroleum engineering, The Last Bow at Dusk (736px downloads)",
] as const;
