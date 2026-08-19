"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Container, Reveal } from "@/components/ui/primitives";
import { howItWorks } from "@/data/content";

/**
 * How It Works — a storytelling rail, not three cards.
 * A line draws as you scroll; each step carries its own small visual that
 * lifts on hover. Content stays in the DOM (accessible, touch-safe).
 */

function BlendArt() {
  return (
    <svg viewBox="0 0 120 60" className="h-14 w-auto" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${12 + i * 24} ${20 + (i % 2) * 12}) rotate(${i * 33})`}>
          <ellipse cx="0" cy="0" rx="9" ry="6" fill="var(--step-art, #c29b63)" opacity="0.9" />
          <path d="M -5 -4 C -2 -1 -1 2 1 6" fill="none" stroke="#241b13" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </g>
      ))}
    </svg>
  );
}

function ScheduleArt() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-auto" aria-hidden>
      <rect x="8" y="12" width="48" height="44" rx="6" fill="none" stroke="var(--step-art, #c29b63)" strokeWidth="2.4" />
      <path d="M 8 24 H 56" stroke="var(--step-art, #c29b63)" strokeWidth="2.4" />
      <path d="M 20 8 V 18 M 44 8 V 18" stroke="var(--step-art, #c29b63)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="32" cy="38" r="6.5" fill="var(--step-art, #c29b63)" opacity="0.85" />
    </svg>
  );
}

function DoorstepArt() {
  return (
    <svg viewBox="0 0 72 60" className="h-14 w-auto" aria-hidden>
      <path
        d="M 8 34 L 20 16 H 52 L 64 34 Z"
        fill="none"
        stroke="var(--step-art, #c29b63)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M 16 32 V 52 H 56 V 32" fill="none" stroke="var(--step-art, #c29b63)" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M 36 34 V 46" stroke="var(--step-art, #c29b63)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="36" cy="26" r="5" fill="var(--step-art, #c29b63)" opacity="0.85" />
    </svg>
  );
}

const arts = [BlendArt, ScheduleArt, DoorstepArt];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const activeReduced = mounted && reduced;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "end 0.45"],
  });
  const draw = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="section-space relative bg-mocha text-paper">
      <div className="grain pointer-events-none absolute inset-0" aria-hidden />
      {/* bottom gradient bridge: mocha → paper transition */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-32 w-full"
        style={{ background: "linear-gradient(to bottom, transparent, #f4efe6)" }}
      />
      <Container className="relative">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Reveal delay={0.08}>
              <h2 className="t-heading-xl balance">
                Three steps between the farm and your cup.
              </h2>
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={0.15}>
              <p className="t-body-l pretty text-paper/60">
                No minimums, no contracts, no calls to make. Just coffee that
                arrives on the day you chose.
              </p>
            </Reveal>
          </div>
        </div>

        <div ref={ref} className="relative mt-16 md:mt-20">
          {/* progress rail */}
          <div
            aria-hidden
            className="absolute left-[18px] top-0 h-full w-px bg-line-dark md:left-0 md:top-[18px] md:h-px md:w-full"
          >
            {!activeReduced && (
              <motion.div
                className="w-px origin-top bg-bronze-2 md:h-px md:w-full md:origin-left"
                style={{ scaleY: draw, scaleX: draw }}
              />
            )}
          </div>

          <ol className="flex flex-col gap-14 pl-12 md:grid md:grid-cols-3 md:gap-8 md:pl-0">
            {howItWorks.map((step, i) => {
              const Art = arts[i];
              return (
                <li key={step.index} className="group relative">
                  {/* number marker */}
                  <span
                    className="font-display absolute -left-12 top-0 grid h-9 w-9 place-items-center rounded-full border border-bronze-2/50 bg-mocha text-[0.8rem] font-semibold text-bronze-2 md:static md:mb-8 md:grid md:h-9 md:w-9"
                    aria-hidden
                  >
                    {step.index}
                  </span>

                  <div className="md:mt-0">
                    <Art />
                    <h3 className="font-display mt-5 text-2xl font-medium tracking-tight">
                      {step.title}
                    </h3>
                    <p className="t-body-m mt-3 max-w-sm text-paper/65">{step.copy}</p>
                    <p className="t-body-s mt-4 max-w-sm text-bronze-2/80 transition-colors duration-300 group-hover:text-bronze-2">
                      {step.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </section>
  );
}
