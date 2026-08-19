"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { HeroScene } from "@/components/hero/HeroScene";
import { HeroProgress, stages } from "@/components/hero/HeroProgress";
import { Button, IconArrow } from "@/components/ui/primitives";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const activeReduced = mounted && reduced;
  const [stage, setStage] = useState(0);

  useEffect(() => setMounted(true), []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(stages.length - 1, Math.floor(v * stages.length));
    setStage((prev) => (prev === next ? prev : next));
  });

  // Content fades out as hero reaches end — bridge to BrandProposition
  const contentOpacity = useTransform(scrollYProgress, [0, 0.72, 0.92], [1, 1, 0]);
  const contentY = useTransform(scrollYProgress, [0.72, 0.92], [0, -30]);
  // Background fades out so BrandProposition's paper color shows through
  const bgOpacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 1, 0]);
  // Paper overlay covers content + scene as they exit
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.82, 0.95], [0, 0, 1]);

  return (
    <section ref={ref} style={{ height: activeReduced ? "100vh" : "340vh" }} className="relative">
      <motion.div
        className="grain sticky top-0 flex h-screen flex-col overflow-hidden bg-mocha text-paper"
        style={activeReduced ? {} : { opacity: bgOpacity }}
      >
        {/* cinematic depth: vignette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 10%, rgba(36,27,19,0) 30%, rgba(20,14,9,0.55) 78%, rgba(13,9,6,0.85) 100%)",
          }}
        />

        {/* fade-out bridge overlay — covers content + scene as they exit */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 bg-paper"
          style={activeReduced ? { opacity: 0 } : { opacity: overlayOpacity }}
        />

        <div className="container-site relative z-10 flex h-full flex-col">
          {/* ---- Copy (scroll-fades out) ---- */}
          <motion.div
            className="flex flex-1 flex-col justify-center pb-4 pt-28 md:pb-8 md:pt-32"
            style={activeReduced ? {} : { opacity: contentOpacity, y: contentY }}
          >
            <motion.p
              initial={activeReduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="t-label flex items-center gap-3 text-bronze-2"
            >
              <span aria-hidden className="h-px w-8 bg-bronze-2/60" />
              Single-origin · Roasted to order
            </motion.p>

            <motion.h1
              initial={activeReduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="t-display-xl mt-5 max-w-3xl"
            >
              Bean, to brew,{" "}
              <span className="italic text-bronze-2">to doorstep.</span>
            </motion.h1>

            <motion.p
              initial={activeReduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="t-body-l mt-5 max-w-xl text-paper/70"
            >
              Six traceable single-origin coffees, roasted after you order and
              delivered across Pakistan on a schedule you control.
            </motion.p>

            <motion.div
              initial={activeReduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Button href="/subscribe" size="lg" variant="light">
                Subscribe Now <IconArrow />
              </Button>
              <Button href="/coffee" size="lg" variant="secondary" className="border-paper/30 text-paper hover:border-paper hover:bg-paper hover:text-ink">
                Explore Coffee
              </Button>
            </motion.div>

            <motion.p
              initial={activeReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="t-caption mt-7 text-paper/65"
            >
              JazzCash · EasyPaisa · Cash on Delivery
            </motion.p>
          </motion.div>

          {/* ---- Cinematic stage ---- */}
          <div className="relative flex items-end justify-center pb-10 md:pb-6">
            <HeroScene progress={scrollYProgress} reduced={!!activeReduced} />
          </div>

          {/* ---- Journey rail ---- */}
          <div className="hidden items-center justify-between pb-8 md:flex">
            <HeroProgress active={stage} />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
