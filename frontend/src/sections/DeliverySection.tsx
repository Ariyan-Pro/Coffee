"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Container, Eyebrow, Reveal } from "@/components/ui/primitives";
import { site } from "@/data/site";

const journey = [
  { label: "Roast", note: "Day 0: your bag is roasted" },
  { label: "Rest", note: "24h: gases settle in the valve bag" },
  { label: "Dispatch", note: "Within 48h of order" },
  { label: "Transit", note: "1-3 days via national courier" },
  { label: "Doorstep", note: "Sealed, dated, ready to brew" },
];

export function DeliverySection() {
  const timelineRef = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 0.7", "end 0.3"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 0.8], [0, 1]);

  return (
    <section className="section-space bg-paper">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <Eyebrow>Delivery</Eyebrow>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="t-heading-xl balance mt-6">
                From our roaster to your door, in days.
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="t-body-l pretty mt-6 text-ink-2">{site.shipping.coverage}.</p>
            </Reveal>

            <div className="mt-8 space-y-4">
              <Reveal delay={0.18}>
                <div className="flex items-center justify-between rounded-lg border border-line bg-cream px-6 py-4 transition-all duration-300 hover:border-bronze/40 hover:shadow-[0_8px_30px_-12px_rgba(134,86,43,0.15)]">
                  <span className="t-body-m text-ink-2">Delivery fee</span>
                  <span className="font-display text-lg font-medium">Rs. 250</span>
                </div>
              </Reveal>
              <Reveal delay={0.22}>
                <div className="flex items-center justify-between rounded-lg border border-bronze/40 bg-bronze/10 px-6 py-4 transition-all duration-300 hover:border-bronze/60 hover:shadow-[0_8px_30px_-12px_rgba(134,86,43,0.2)]">
                  <span className="t-body-m text-ink">Free delivery on orders over</span>
                  <span className="font-display text-lg font-medium text-bronze">Rs. 5,000</span>
                </div>
              </Reveal>
              <Reveal delay={0.26}>
                <div className="flex items-center justify-between rounded-lg border border-line bg-cream px-6 py-4 transition-all duration-300 hover:border-bronze/40 hover:shadow-[0_8px_30px_-12px_rgba(134,86,43,0.15)]">
                  <span className="t-body-m text-ink-2">Payment</span>
                  <span className="t-body-s font-semibold">JazzCash · EasyPaisa · COD</span>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Journey timeline with scroll-linked progress */}
          <div className="lg:col-span-7">
            <div className="flex h-full flex-col justify-center">
              <ol ref={timelineRef} className="relative space-y-0">
                {/* Scroll-animated connecting line */}
                <motion.div
                  aria-hidden
                  className="absolute left-[19px] top-0 w-px bg-bronze/40 origin-top"
                  style={reduce ? { height: "100%" } : { scaleY: lineHeight }}
                />
                {journey.map((j, i) => (
                  <motion.li
                    key={j.label}
                    className="group flex gap-6"
                    initial={reduce ? {} : { opacity: 0, x: -16 }}
                    whileInView={reduce ? {} : { opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-bronze/40 bg-paper font-display text-sm font-semibold text-bronze transition-all duration-300 group-hover:border-bronze group-hover:bg-bronze group-hover:text-paper group-hover:scale-110">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {i < journey.length - 1 && (
                        <span aria-hidden className="w-px flex-1 bg-line" />
                      )}
                    </div>
                    <div className="pb-8 pt-1">
                      <h3 className="font-display text-xl font-medium tracking-tight transition-colors duration-300 group-hover:text-bronze">{j.label}</h3>
                      <p className="t-caption mt-1 text-ink-3">{j.note}</p>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
