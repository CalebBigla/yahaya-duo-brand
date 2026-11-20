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
      className="btn-interactive group animate-settle fixed bottom-5 right-5 z-50 flex h-14 items-center gap-0 rounded-full bg-[oklch(0.5_0.13_150)] pl-4 pr-4 text-white shadow-elevated transition-[gap,padding] duration-300 hover:gap-2 hover:pr-5 focus-visible:gap-2 focus-visible:pr-5 sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="h-6 w-6 shrink-0" strokeWidth={1.75} />
      {/* The label slides out on hover or keyboard focus. */}
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-[max-width] duration-300 ease-out group-hover:max-w-40 group-focus-visible:max-w-40">
        Chat on WhatsApp
      </span>
    </a>
  );
}
