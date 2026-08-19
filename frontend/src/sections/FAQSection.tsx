"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/primitives";
import { FAQAccordion } from "@/components/content/FAQAccordion";
import { faqItems } from "@/data/content";

export function FAQSection() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.3"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 1], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0, 0.3], [40, 0]);

  return (
    <section ref={ref} className="section-space relative bg-paper-2">
      {/* bottom gradient bridge: paper-2 → mocha transition */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-40 w-full"
        style={{ background: "linear-gradient(to bottom, transparent, #241b13)" }}
      />
      <Container className="max-w-5xl">
        <motion.div style={reduce ? {} : { opacity, y }}>
          <FAQAccordion items={faqItems.slice(0, 6)} title="Before your first order" />
        </motion.div>
        <motion.div
          className="mt-10 text-center"
          style={reduce ? {} : { opacity: useTransform(scrollYProgress, [0.2, 0.5], [0, 1]) }}
        >
          <a href="/faq" className="t-body-s inline-flex items-center gap-2 font-semibold text-bronze transition-colors hover:text-ember">
            Read all eight questions
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </motion.div>
      </Container>
    </section>
  );
}
