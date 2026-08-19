"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Container, Button, IconArrow } from "@/components/ui/primitives";
import { site, whatsappLink } from "@/data/site";

/**
 * Final conversion opportunity with scroll-linked glow intensification.
 */
export function FinalCTA() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const wa = whatsappLink("Hi EMBER, I'd like help building my first subscription.");

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.4"],
  });

  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.15, 0.35, 0.5]);
  const contentY = useTransform(scrollYProgress, [0, 0.4], [50, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.35], [0, 1]);

  return (
    <section ref={ref} className="section-space relative overflow-hidden bg-mocha text-paper">
      <div className="grain pointer-events-none absolute inset-0" aria-hidden />
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 90% at 50% 110%, rgba(194,155,99,0.28) 0%, rgba(36,27,19,0) 60%)",
          opacity: reduce ? 0.35 : glowOpacity,
        }}
      />
      <Container className="relative">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          style={reduce ? {} : { opacity: contentOpacity, y: contentY }}
        >
          <p className="t-label text-bronze-2">Ready when you are</p>
          <h2 className="t-display-l balance mt-6">
            Your first fresh bag is{" "}
            <span className="italic text-bronze-2">one click away.</span>
          </h2>
          <p className="t-body-l pretty mx-auto mt-6 max-w-xl text-paper/65">
            Pick a blend, choose your rhythm, and we will take it from there.
            Roasted to order, delivered on schedule.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button href="/subscribe" size="lg" variant="light">
              Build your subscription <IconArrow />
            </Button>
            {wa && (
              <Button href={wa} size="lg" variant="secondary" className="border-paper/30 text-paper hover:border-paper hover:bg-paper hover:text-ink">
                Ask us on WhatsApp
              </Button>
            )}
          </div>
          <p className="t-caption mt-8 text-paper/60">
            {site.contact.hours} · We reply within a day
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
