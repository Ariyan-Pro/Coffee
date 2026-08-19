/**
 * Brand & site configuration.
 * The WhatsApp number is read from environment at build time —
 * no invented number is hardcoded. Until NEXT_PUBLIC_WHATSAPP_NUMBER is
 * set, the WhatsApp entry is not rendered.
 */

export const site = {
  name: "EMBER",
  tagline: "Specialty coffee, roasted to order.",
  description:
    "Premium coffee beans sourced from around the world and delivered fresh across Pakistan through a convenient subscription.",
  url: "https://ember.example.com", // TODO: replace with production origin
  contact: {
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
    email: "hello@ember.example.com", // TODO: replace with production email
    hours: "Mon - Sat, 9:00 - 18:00 PKT",
  },
  shipping: {
    deliveryFee: 250,
    freeDeliveryThreshold: 5000,
    coverage: "All major cities across Pakistan (Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, and more)",
  },
  nav: [
    { label: "Coffee", href: "/coffee" },
    { label: "Subscription", href: "/subscribe" },
    { label: "Our Story", href: "/about" },
    { label: "FAQ", href: "/faq" },
  ],
};

export const whatsappLink = (message = ""): string => {
  if (!site.contact.whatsapp) return "";
  const digits = site.contact.whatsapp.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};
