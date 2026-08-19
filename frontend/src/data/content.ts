/**
 * Editorial content fixtures. Copy is part of the interface — it is written,
 * not placeholder. All factual claims map to the actual product system
 * (roast-to-order, 250g bags, delivery terms, payment methods).
 */

export interface FaqItem {
  q: string;
  a: string;
}

export const faqItems: FaqItem[] = [
  {
    q: "When do you roast?",
    a: "We roast to order. Every bag is roasted after your subscription is confirmed, then sealed and shipped within 48 hours. Coffee leaves us fresh and reaches you within a few days. It never sits on a warehouse shelf.",
  },
  {
    q: "Which cities do you deliver to?",
    a: "We deliver across all major cities in Pakistan: Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad and beyond, through national courier partners. Delivery is Rs. 250 per shipment and free on orders over Rs. 5,000.",
  },
  {
    q: "How does the subscription work?",
    a: "Pick a blend, choose a schedule (weekly or monthly) and a quantity, and tell us where to deliver. We roast your bag and send it on schedule. You can pause, resume or cancel anytime from your account. No phone calls, no locks.",
  },
  {
    q: "Can I change or skip a delivery?",
    a: "Yes. Adjust your quantity or delivery address from your account, and pause a cycle whenever you are travelling. Changes apply from your next scheduled delivery.",
  },
  {
    q: "How do I pay?",
    a: "We accept JazzCash, EasyPaisa and cash on delivery. Card options can be added per shipment if you prefer to pay at the door. Your choice each cycle.",
  },
  {
    q: "What grind should I choose?",
    a: "Whole bean if you grind at home (it keeps flavour longest). Otherwise pick coarse for French press, medium for pour-over and drip, fine for Aeropress, or espresso for your machine. Not sure? Whole bean is never a wrong answer.",
  },
  {
    q: "Do you offer a discount for subscribing?",
    a: "Yes. Subscriptions carry an automatic discount on every bag: 10% on weekly, 12% on biweekly and 15% on monthly plans. The discount is applied to each cycle's order.",
  },
  {
    q: "How long does coffee stay fresh?",
    a: "Sealed in a one-way valve bag and stored out of light, a roast holds peak flavour for about four weeks. That is why we roast in small batches and only after you order. Most commercial coffee is months old before it reaches you.",
  },
];

export interface Step {
  index: string;
  title: string;
  copy: string;
  detail: string;
}

export const howItWorks: Step[] = [
  {
    index: "01",
    title: "Choose your blend",
    copy: "Six single-origin coffees, roasted to order. Pick by origin, roast or tasting notes.",
    detail: "Every lot is cupped before it is listed. If we would not serve it at our own table, it does not ship.",
  },
  {
    index: "02",
    title: "Set your schedule",
    copy: "Weekly for a heavy household, monthly for a steady solo cup. Discounts apply automatically.",
    detail: "Pause, skip or cancel in two clicks. No contracts, no calls, no guilt.",
  },
  {
    index: "03",
    title: "Receive at your doorstep",
    copy: "Roasted, sealed and shipped within 48 hours, across Pakistan, straight to your door.",
    detail: "Track every delivery. Pay with JazzCash, EasyPaisa or cash on delivery.",
  },
];

export const qualityClaims = [
  {
    title: "Roasted to order",
    copy: "We do not roast ahead and hope. Your bag is roasted after you confirm. Peak flavour, not shelf stock.",
  },
  {
    title: "Single-origin only",
    copy: "No anonymous commodity blends. Every coffee names its country, region and farm lot.",
  },
  {
    title: "Small batches",
    copy: "Each lot is roasted in batches small enough to control, and cupped before it is listed.",
  },
  {
    title: "Fresh-sealed",
    copy: "One-way valve bags release CO₂ without letting oxygen in, keeping the roast alive for weeks.",
  },
];

export const originStory = {
  headline: "From a single farm to your first sip",
  intro:
    "We started EMBER with one conviction: people in Pakistan deserve coffee that tastes like the place it came from. That meant skipping the commodity market and buying directly from farms we can name.",
  body: [
    "Every lot we list is traceable to a washing station or estate: Idido in Ethiopia, El Diviso in Colombia, Kieni in Kenya. We buy from the same sources year to year, paying above commodity price for the lots that score highest at the cupping table.",
    "Then we roast the way a kitchen works: to order, in small batches, for people who will actually drink it. No blending for consistency, no inventory that goes stale while waiting on a shelf.",
    "The subscription exists so that freshness is not a one-time event. A bag shows up when you need it, roasted days earlier, with the roast date on the bag.",
  ],
};

export const journeyStages = [
  { label: "Bean" },
  { label: "Roast" },
  { label: "Grind" },
  { label: "Brew" },
  { label: "Doorstep" },
];
