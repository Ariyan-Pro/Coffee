import type { Metadata } from "next";
import { Container, Eyebrow, Reveal, Button } from "@/components/ui/primitives";
import { FAQAccordion } from "@/components/content/FAQAccordion";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqItems } from "@/data/content";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about EMBER's coffee subscription: freshness, roast dates, delivery across Pakistan, payment options, pausing or cancelling, and grind types.",
  alternates: { canonical: `${site.url}/faq` },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqLd} />
      <section className="section-space-sm bg-paper pt-28">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <Eyebrow>FAQ</Eyebrow>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="t-display-l balance mt-6">Questions, answered.</h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="t-body-l pretty mt-6 text-ink-2">
                The things people ask before their first order: freshness, delivery, payment and
                flexibility.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section-space-sm bg-cream">
        <Container className="max-w-3xl">
          <Reveal>
            <FAQAccordion items={faqItems} />
          </Reveal>
        </Container>
      </section>

      <section className="section-space-sm bg-paper">
        <Container>
          <div className="mx-auto max-w-2xl rounded-lg border border-line bg-cream px-8 py-10 text-center">
            <h2 className="t-heading-l balance">Still curious?</h2>
            <p className="t-body-m pretty mt-3 text-ink-2">
              Ask us directly. We reply within one working day.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/contact">Contact us</Button>
              <Button href="/subscribe" variant="secondary">
                Start a subscription
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
