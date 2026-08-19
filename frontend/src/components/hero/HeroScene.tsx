"use client";

import { useMotionValue, type MotionValue } from "framer-motion";
import { DesktopScene } from "@/components/hero/cinema/DesktopScene";
import { MobileScene } from "@/components/hero/cinema/MobileScene";

interface HeroSceneProps {
  progress: MotionValue<number>;
  reduced: boolean;
}

/**
 * Responsive cinematic stage.
 *
 * The story is continuous: scroll position drives every element through
 * useTransform chains (rAF-backed, no React re-renders per frame), so the
 * beans, grinder, brewer, cup and the barista's hand flow without jumps.
 *
 *   desktop -> full editorial composition (figure, grinder, brewer, depth)
 *   mobile  -> simplified portrait composition, same story
 *   reduced -> static still resolved to the finished cup (no animation)
 */
export function HeroScene({ progress, reduced }: HeroSceneProps) {
  // Pinned finished state for the reduced-motion still: every transform
  // resolves to its end value, producing a calm, complete final image.
  const finished = useMotionValue(1);

  if (reduced) {
    return (
      <div className="relative mx-auto w-full max-w-2xl" role="img" aria-label="A barista finishing a freshly brewed cup of EMBER coffee">
        <DesktopScene progress={finished} reduced className="hidden md:block h-auto w-full" />
        <MobileScene progress={finished} reduced className="md:hidden h-auto w-full" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl" aria-hidden>
      <DesktopScene progress={progress} className="hidden md:block h-auto w-full" />
      <MobileScene progress={progress} className="md:hidden h-auto w-full" />
    </div>
  );
}
