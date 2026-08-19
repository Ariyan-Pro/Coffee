"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Container, Reveal, Button } from "@/components/ui/primitives";
import { originStory } from "@/data/content";

/**
 * Origin story — editorial two-column narrative with parallax art panel.
 */
export function OriginStory() {
  const artRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: artRef,
    offset: ["start end", "end start"],
  });

  const artY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const artScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, 1.02]);

  return (
    <section className="section-space bg-paper">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Art panel with parallax */}
          <div className="lg:col-span-5">
            <Reveal>
              <motion.div
                ref={artRef}
                className="relative flex aspect-[4/5] items-end overflow-hidden rounded-lg bg-mocha p-8"
                style={reduce ? {} : { y: artY, scale: artScale }}
              >
                <div className="grain absolute inset-0" aria-hidden />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(90% 70% at 30% 0%, rgba(194,155,99,0.35) 0%, rgba(36,27,19,0) 55%)",
                  }}
                />
                <div className="relative">
                  <svg viewBox="0 0 160 112" className="h-40 w-auto" aria-hidden>
                    {[
                      { x: 30, y: 42, d: 20 },
                      { x: 66, y: 26, d: 60 },
                      { x: 98, y: 48, d: 10 },
                      { x: 132, y: 30, d: 80 },
                      { x: 58, y: 66, d: 40 },
                      { x: 118, y: 74, d: 0 },
                      { x: 86, y: 88, d: 110 },
                    ].map((s, i) => (
                      <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.d})`}>
                        <ellipse cx="0" cy="0" rx="12" ry="8" fill="#c29b63" opacity="0.92" />
                        <path d="M -6 -5 C -2 -1 -1 3 2 7" fill="none" stroke="#241b13" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                      </g>
                    ))}
                  </svg>
                  <blockquote className="font-display mt-8 max-w-xs text-2xl font-light italic leading-snug text-paper/90">
                    "Every lot we list, we can tell you who grew it."
                  </blockquote>
                  <p className="t-caption mt-4 text-bronze-2">The EMBER sourcing rule</p>
                </div>
              </motion.div>
            </Reveal>
          </div>

          {/* Narrative */}
          <div className="lg:col-span-7">
            <Reveal delay={0.08}>
              <h2 className="t-heading-xl balance">{originStory.headline}</h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="t-body-l pretty mt-6 text-ink-2">{originStory.intro}</p>
            </Reveal>
            <div className="mt-8 space-y-6">
              {originStory.body.map((para, i) => (
                <Reveal key={i} delay={0.04 * i}>
                  <p className="t-body-m pretty text-ink-2">{para}</p>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.2}>
              <div className="mt-10">
                <Button href="/about" variant="secondary">
                  Read the full story
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
