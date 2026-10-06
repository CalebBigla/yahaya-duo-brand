import { supabase } from "@/lib/supabase";

export interface HomepageContent {
  id: string;
  hero_title: string;
  hero_subtitle: string | null;
  hero_cta_text: string | null;
  hero_cta_link: string | null;
  hero_image_url: string | null;
  stats_years_experience: number | null;
  stats_clients_served: number | null;
  stats_destinations: number | null;
  stats_success_rate: number | null;
  mission_title: string | null;
  mission_content: string | null;
  vision_title: string | null;
  vision_content: string | null;
}

export interface WebsiteService {
  id: string;
  division: "travel" | "trade";
  slug: string;
  title: string;
  summary: string;
  detail: string;
  icon_name: string | null;
  image_url: string | null;
  display_order: number;
}

export interface WebsiteSettings {
  id: string;
  company_name: string;
  company_short_name: string | null;
  sub_brand: string | null;
  rc_number: string | null;
  email: string;
  phone_primary: string;
  phone_secondary: string | null;
  whatsapp_number: string;
  address_street: string;
  address_locality: string;
  address_region: string;
  address_country: string;
  business_hours: Array<{ days: string; time: string }> | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  tiktok_url: string | null;
}

export interface WebsiteTestimonial {
  id: string;
  client_name: string;
  client_title: string | null;
  testimonial: string;
  rating: number | null;
  service_division: "travel" | "trade" | "both" | null;
  display_order: number;
}

export interface WebsiteGalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: "travel" | "trade" | "events" | "team" | "partners";
  display_order: number;
  alt_text: string | null;
}

export interface WebsiteFaq {
  id: string;
  category: "general" | "travel" | "trade" | "visa" | "payment";
  question: string;
  answer: string;
  display_order: number;
}

export interface WebsiteVisaDestination {
  id: string;
  country: string;
  visa_types: string;
  processing_time: string;
  notes: string;
  display_order: number;
}

export interface WebsiteSeo {
  id: string;
  page_slug: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  twitter_card_type: "summary" | "summary_large_image";
}

async function readPublished<T>(
  table: string,
  options?: {
    division?: "travel" | "trade";
    pageSlug?: string;
    featured?: boolean;
    limit?: number;
  },
) {
  let query = supabase.from(table).select("*").eq("status", "published");

  if (options?.division) query = query.eq("division", options.division);
  if (options?.pageSlug) query = query.eq("page_slug", options.pageSlug);
  if (options?.featured !== undefined) query = query.eq("featured", options.featured);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) {
    console.warn(`Unable to load published ${table}:`, error.message);
    return null;
  }

  return (data ?? []) as T[];
}

export async function getPublishedHomepage() {
  const rows = await readPublished<HomepageContent>("website_homepage");
  return rows?.[0] ?? null;
}

export async function getPublishedServices(division: "travel" | "trade") {
  const rows = await readPublished<WebsiteService>("website_services", { division });
  return rows?.sort((a, b) => a.display_order - b.display_order) ?? null;
}

export async function getPublishedSettings() {
  const rows = await readPublished<WebsiteSettings>("website_settings");
  return rows?.[0] ?? null;
}

export async function getFeaturedTestimonials() {
  const rows = await readPublished<WebsiteTestimonial>("website_testimonials", {
    featured: true,
    limit: 3,
  });
  return rows?.sort((a, b) => a.display_order - b.display_order) ?? null;
}

export async function getPublishedGallery() {
  const rows = await readPublished<WebsiteGalleryItem>("website_gallery");
  return rows?.sort((a, b) => a.display_order - b.display_order) ?? null;
}

export async function getPublishedFAQs() {
  const rows = await readPublished<WebsiteFaq>("website_faqs");
  return rows?.sort((a, b) => a.display_order - b.display_order) ?? null;
}

export async function getPublishedVisaDestinations() {
  const rows = await readPublished<WebsiteVisaDestination>("website_visa_destinations");
  return rows?.sort((a, b) => a.display_order - b.display_order) ?? null;
}

export async function getPublishedSEO(pageSlug: string) {
  const rows = await readPublished<WebsiteSeo>("website_seo", { pageSlug });
  return rows?.[0] ?? null;
}
