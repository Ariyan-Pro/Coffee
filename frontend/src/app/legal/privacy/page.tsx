import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How EMBER collects, uses and protects the personal information you share when you order.",
  alternates: { canonical: `${site.url}/legal/privacy` },
};

const sections = [
  {
    h: "1. What we collect",
    p: [
      "When you place an order or contact us, we collect the information needed to fulfil it: your name, phone number, delivery address and (if you provide it) email address.",
      "We do not store full payment card details. Mobile-wallet payments are handled by the wallet provider; cash-on-delivery is settled with the courier.",
    ],
  },
  {
    h: "2. Why we use it",
    p: [
      "Your details are used to process orders, confirm deliveries, arrange payment and respond to your messages. We may send order-related updates (e.g. dispatch confirmation) by WhatsApp or phone.",
      "We only send marketing messages if you have separately opted in, and you can opt out at any time.",
    ],
  },
  {
    h: "3. Sharing",
    p: [
      "We share delivery details only with the courier carrying your order, and payment details only with the wallet provider processing your payment. We never sell personal data.",
    ],
  },
  {
    h: "4. How long we keep it",
    p: [
      "Order records are kept as long as needed to fulfil and support your orders and to meet legal/accounting obligations. You can request deletion of your personal data at any time via the contact page.",
    ],
  },
  {
    h: "5. Your rights",
    p: [
      "You may request a copy, correction or deletion of the personal data we hold about you. We respond to such requests within a reasonable time and at no charge.",
    ],
  },
  {
    h: "6. Contact",
    p: [
      "Questions about this policy can be sent through the contact page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <section className="section-space-sm bg-paper pt-28">
      <Container>
        <div className="mx-auto max-w-3xl">
          <Eyebrow>Legal</Eyebrow>
          <h1 className="t-display-l balance mt-6">Privacy Policy</h1>
          <p className="t-caption mt-4 text-ink-3">Last updated: August 2026 · Applies to ember.example.com</p>

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
