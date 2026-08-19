import type { Metadata } from "next";
import { Suspense } from "react";
import { CommerceProvider } from "@/components/subscription/CommerceProvider";
import { SubscriptionConfiguratorWithParams } from "@/components/subscription/SubscriptionConfiguratorWithParams";
import { Container, Eyebrow, Reveal } from "@/components/ui/primitives";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Build Your Subscription",
  description:
    "Choose a single-origin blend, pick a weekly or monthly schedule, and get fresh-roasted coffee delivered across Pakistan. 10-15% off every bag.",
  alternates: { canonical: `${site.url}/subscribe` },
  openGraph: {
    title: "Build Your Subscription | EMBER",
    description:
      "Pick a blend, set a schedule, and get fresh-roasted coffee delivered across Pakistan, with 10-15% off every bag.",
    url: `${site.url}/subscribe`,
    type: "website",
  },
};

export default function SubscribePage() {
  return (
    <div className="section-space-sm bg-paper pt-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <Eyebrow>The subscription</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="t-display-l balance mt-6">Build your subscription.</h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="t-body-l pretty mt-6 text-ink-2">
              A blend, a rhythm, a doorstep. Roasted after you order, delivered
              on schedule, with 10-15% off every bag.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {["Roasted to order", "Free delivery over Rs. 5,000", "Pause or cancel anytime"].map((t) => (
                <li key={t} className="t-caption flex items-center gap-2 text-ink-3">
                  <span aria-hidden className="h-1 w-1 rounded-full bg-bronze" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="mt-16">
          <CommerceProvider>
            <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-paper-2" />}>
              <SubscriptionConfiguratorWithParams />
            </Suspense>
          </CommerceProvider>
        </div>
      </Container>
    </div>
  );
}
