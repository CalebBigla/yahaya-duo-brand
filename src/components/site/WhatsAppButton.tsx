import { MessageCircle } from "lucide-react";
import { generalWhatsapp } from "@/lib/site";

export function WhatsAppFab() {
  return (
    <a
      href={generalWhatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.62_0.17_150)] text-white shadow-elevated transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
