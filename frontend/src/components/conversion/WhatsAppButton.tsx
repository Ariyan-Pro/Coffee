"use client";

import { site, whatsappLink } from "@/data/site";
import { IconWhatsApp } from "@/components/ui/primitives";

/**
 * WhatsApp support entry. Rendered only when the number is configured
 * (NEXT_PUBLIC_WHATSAPP_NUMBER) — no invented number is ever hardcoded.
 */
export function WhatsAppButton() {
  const href = whatsappLink("Hi EMBER, I'd like to know more about your coffee subscription.");
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-13 w-13 place-items-center rounded-full bg-[#25D366] p-3.5 text-white shadow-xl shadow-black/20 transition-transform hover:scale-105"
      style={{ height: 52, width: 52 }}
    >
      <IconWhatsApp className="h-6 w-6" />
    </a>
  );
}
