import type { Metadata } from "next";
import { Container, Eyebrow, Reveal, Heading } from "@/components/ui/primitives";
import { ContactForm } from "@/components/contact/ContactForm";
import { site, whatsappLink } from "@/data/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about an order, a subscription, or wholesale? Message EMBER and get a reply within one working day.",
  alternates: { canonical: `${site.url}/contact` },
};

export default function ContactPage() {
  return (
    <section className="section-space-sm bg-paper pt-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <Eyebrow>Contact</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="t-display-l balance mt-6">Talk to the roastery.</h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="t-body-l pretty mt-6 text-ink-2">
              Orders, subscriptions, wholesale or a question about your cup. A human reads every
              message.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <Reveal>
              <ContactForm />
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <Reveal delay={0.1}>
              <div className="space-y-6">
                <div className="rounded-lg border border-line bg-cream p-7">
                  <Heading size="heading-m">How to reach us</Heading>
                  <dl className="mt-5 space-y-4">
                    {site.contact.email && (
                      <div>
                        <dt className="t-label text-[0.62rem] text-ink-3">Email</dt>
                        <dd>
                          <a
                            href={`mailto:${site.contact.email}`}
                            className="t-body-s text-ink underline decoration-bronze/50 underline-offset-4 transition-colors hover:text-bronze"
                          >
                            {site.contact.email}
                          </a>
                        </dd>
                      </div>
                    )}
                    {whatsappLink() && (
                      <div>
                        <dt className="t-label text-[0.62rem] text-ink-3">WhatsApp</dt>
                        <dd>
                          <a
                            href={whatsappLink("Hi EMBER, I have a question.")}
                            className="t-body-s text-ink underline decoration-bronze/50 underline-offset-4 transition-colors hover:text-bronze"
                          >
                            Chat with us
                          </a>
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="t-label text-[0.62rem] text-ink-3">Response time</dt>
                      <dd className="t-body-s text-ink">Within one working day</dd>
                    </div>
                    <div>
                      <dt className="t-label text-[0.62rem] text-ink-3">Based in</dt>
                      <dd className="t-body-s text-ink">Lahore, Pakistan, shipping nationwide</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg border border-line bg-cream p-7">
                  <Heading size="heading-m">For your first order</Heading>
                  <p className="t-body-m pretty mt-3 text-ink-2">
                    Skip the message entirely: pick a blend, set a schedule and we will confirm
                    everything before your first roast.
                  </p>
                  <a
                    href="/subscribe"
                    className="t-body-s mt-4 inline-block font-semibold text-bronze underline decoration-bronze/40 underline-offset-4 transition-colors hover:text-ink"
                  >
                    Build your subscription →
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
