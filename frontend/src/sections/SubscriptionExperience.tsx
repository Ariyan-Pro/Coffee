"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Container, Eyebrow, Reveal, Button, IconCheck, IconArrow } from "@/components/ui/primitives";
import { plans } from "@/data/products";

/**
 * The subscription proposition with staggered plan cards and hover depth.
 */
export function SubscriptionExperience() {
  const reduce = useReducedMotion();

  return (
    <section className="section-space relative overflow-hidden bg-mocha text-paper">
      <div className="grain pointer-events-none absolute inset-0" aria-hidden />
      {/* bottom gradient bridge: mocha → paper transition */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-32 w-full"
        style={{ background: "linear-gradient(to bottom, transparent, #f4efe6)" }}
      />
      <Container className="relative">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          {/* Copy */}
          <div className="lg:col-span-6">
            <Reveal>
              <Eyebrow dark>The subscription</Eyebrow>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="t-heading-xl balance mt-6">
                Never run out of good coffee again.
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="t-body-l pretty mt-6 max-w-lg text-paper/65">
                Choose a blend and a rhythm. We roast on your schedule, seal it
                fresh, and have it at your door before you pour the last cup.
                Pause or cancel anytime, from your account, in two clicks.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <ul className="mt-8 space-y-3.5">
                {[
                  "Roasted only after your order is confirmed",
                  "Pick whole bean or a grind for your brew method",
                  "Pause, skip or cancel without calling anyone",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3 text-paper/80">
                    <IconCheck className="mt-1 h-4 w-4 shrink-0 text-bronze-2" />
                    <span className="t-body-m">{line}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.25}>
              <div className="mt-10">
                <Button href="/subscribe" size="lg" variant="light">
                  Build your subscription <IconArrow />
                </Button>
              </div>
            </Reveal>
          </div>

          {/* Plan cards with staggered entrance */}
          <div className="lg:col-span-6">
            <motion.div
              className="grid gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.12 } },
              }}
            >
              {plans.map((plan) => (
                <motion.div
                  key={plan.slug}
                  variants={{
                    hidden: reduce ? {} : { opacity: 0, y: 24, scale: 0.97 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                    },
                  }}
                  whileHover={reduce ? {} : { scale: 1.02, y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                  className="group flex items-center justify-between gap-6 rounded-lg border border-line-dark bg-mocha-2/60 px-6 py-5 transition-all duration-300 hover:border-bronze-2/40 hover:bg-mocha-2 hover:shadow-[0_16px_40px_-16px_rgba(194,155,99,0.15)]"
                >
                  <div>
                    <h3 className="font-display text-xl font-medium tracking-tight">{plan.name}</h3>
                    <p className="t-caption mt-1 text-paper/60">{plan.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="font-display text-3xl font-medium text-bronze-2">
                      {plan.discount_percent}%
                    </span>
                    <p className="t-label mt-1 text-[0.6rem] text-paper/65">off every bag</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <Reveal delay={0.2}>
              <p className="t-caption mt-5 text-paper/60">
                Discounts apply automatically to each delivery. Final pricing is
                confirmed on the checkout screen.
              </p>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
