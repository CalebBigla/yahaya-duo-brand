import { useQuery } from "@tanstack/react-query";
import { getPublishedSettings } from "@/lib/queries/website";
import { site, toE164 } from "@/lib/site";

/**
 * Published company settings from the CMS, with the defaults in site.ts as a fallback.
 * One place for the header, footer, contact routes and the advisor button.
 * Social links are returned only when the CMS has a URL for them.
 */
export function useSiteSettings() {
  const { data: settings } = useQuery({
    queryKey: ["website", "settings"],
    queryFn: getPublishedSettings,
    staleTime: 60_000,
  });

  const phones = settings
    ? [settings.phone_primary, settings.phone_secondary].filter((p): p is string => Boolean(p))
    : [...site.phones];
  const whatsappNumber = settings?.whatsapp_number || site.whatsappNumber;
  const hours: Array<{ days: string; time: string }> = settings?.business_hours?.length
    ? settings.business_hours
    : site.hours.map(({ days, time }) => ({ days, time }));

  const socials = [
    { label: "Instagram", url: settings?.instagram_url },
    { label: "Facebook", url: settings?.facebook_url },
    { label: "LinkedIn", url: settings?.linkedin_url },
    { label: "X", url: settings?.twitter_url },
    { label: "TikTok", url: settings?.tiktok_url },
  ].filter((s): s is { label: string; url: string } => Boolean(s.url));

  return {
    name: settings?.company_name ?? site.name,
    rcNumber: settings?.rc_number ?? site.rcNumber,
    addressLine: settings
      ? [settings.address_street, settings.address_locality, settings.address_region].filter(Boolean).join(", ")
      : site.addressLine,
    email: settings?.email ?? site.email,
    phones,
    primaryPhone: phones[0] ?? site.phones[0],
    telHref: `tel:${toE164(phones[0] ?? site.phones[0])}`,
    whatsappNumber,
    whatsappUrl: (message = "Hello Yahaya, I would like to speak to an advisor.") =>
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
    hours,
    socials,
  };
}
