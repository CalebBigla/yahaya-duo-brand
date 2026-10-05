import { MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { generalWhatsapp } from "@/lib/site";
import { getPublishedSettings } from "@/lib/queries/website";

export function WhatsAppFab() {
  const { data: settings } = useQuery({
    queryKey: ["website", "settings"],
    queryFn: getPublishedSettings,
    staleTime: 60_000,
  });
  const whatsapp = settings?.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent("Hello Yahaya! I would like to make an enquiry.")}`
    : generalWhatsapp;

  return (
    <a
      href={whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="btn-interactive fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.62_0.17_150)] text-white shadow-elevated animate-pulse-scale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <MessageCircle className="h-8 w-8" />
    </a>
  );
}
