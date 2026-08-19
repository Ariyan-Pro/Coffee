import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you order from EMBER, including subscriptions, payments and cancellations.",
  alternates: { canonical: `${site.url}/legal/terms` },
};

const sections = [
  {
    h: "1. What these terms cover",
    p: [
      "These terms govern every order placed with EMBER, including one-off purchases and subscriptions. By placing an order you confirm you have read and accept them.",
      "EMBER is a coffee roastery based in Lahore, Pakistan, delivering nationwide.",
    ],
  },
  {
    h: "2. Our coffee and freshness promise",
    p: [
      "Every bag is roasted to order after an order is confirmed, and is sealed in a one-way valve bag with the roast date printed on it. We state a grind option at order time; whole bean is always available.",
      "Roast levels and tasting notes are described to the best of our knowledge from the supplier's lot sheet and our own cupping. Individual taste can vary.",
    ],
  },
  {
    h: "3. Subscriptions",
    p: [
      "A subscription means a recurring delivery of coffee on the schedule you choose (weekly or monthly). The total for each delivery is shown before you confirm.",
      "Subscription discounts (10-15% off bag price) apply automatically to every scheduled delivery while the subscription is active.",
      "There is no lock-in. You can pause, skip or cancel a subscription at any time before the next order is confirmed for roasting.",
    ],
  },
  {
    h: "4. Prices, payment and delivery",
    p: [
      "Prices are in Pakistani Rupees and include the bag price; delivery is charged separately unless your order meets the free-delivery threshold shown at checkout (currently Rs. 5,000).",
      "We accept JazzCash, EasyPaisa and cash on delivery. An order is only scheduled for roasting once payment is confirmed.",
      "Orders are dispatched within 48 hours of roasting via national courier. Delivery times depend on the courier and your city.",
    ],
  },
  {
    h: "5. Cancellations and refunds",
    p: [
      "You may cancel an order before roasting has started for a full refund. Once a bag has been roasted or dispatched, it cannot be returned for freshness reasons. Coffee is perishable and roasted to order for you.",
      "If your bag arrives damaged or the contents are not what you ordered, contact us within 48 hours with a photo and we will replace or refund it.",
    ],
  },
  {
    h: "6. Liability",
    p: [
      "To the extent permitted by law, EMBER's liability for any order is limited to the amount you paid for that order. Nothing in these terms limits liability that cannot be limited by law.",
    ],
  },
  {
    h: "7. Changes and contact",
    p: [
      "We may update these terms from time to time; the version on this page always applies. For questions, use the contact page.",
    ],
  },
];

export default function TermsPage() {
  return (
    <section className="section-space-sm bg-paper pt-28">
      <Container>
        <div className="mx-auto max-w-3xl">
          <Eyebrow>Legal</Eyebrow>
          <h1 className="t-display-l balance mt-6">Terms of Service</h1>
          <p className="t-caption mt-4 text-ink-3">Last updated: August 2026</p>

          <div className="mt-12 space-y-10">
            {sections.map((s) => (
              <div key={s.h} className="border-t border-line pt-6">
                <h2 className="font-display text-2xl font-medium tracking-tight text-ink">{s.h}</h2>
                {s.p.map((para, i) => (
                  <p key={i} className="t-body-m pretty mt-4 leading-relaxed text-ink-2">
                    {para}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
