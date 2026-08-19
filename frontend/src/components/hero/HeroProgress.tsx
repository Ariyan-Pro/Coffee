"use client";

import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/format";

export const stages = [
  { label: "Bean" },
  { label: "Roast" },
  { label: "Grind" },
  { label: "Brew" },
  { label: "Doorstep" },
];

/**
 * The bean→doorstep journey rail. Active stage is driven by scroll progress
 * (via useMotionValueEvent in the parent) so the label updates at most once
 * per stage change.
 */
export function HeroProgress({ active }: { active: number }) {
  return (
    <div className="flex items-center gap-4" aria-hidden>
      {stages.map((s, i) => (
        <div key={s.label} className="flex items-center gap-4">
          <div
            className={cn(
              "flex items-baseline gap-2 transition-colors duration-500",
              i === active ? "text-paper" : "text-paper/35",
            )}
          >
            <span className="t-label">{pad2(i + 1)}</span>
            <span className="t-caption hidden tracking-[0.1em] sm:inline">{s.label}</span>
          </div>
          {i < stages.length - 1 && (
            <div className="h-px w-6 bg-paper/20 sm:w-10">
              <div
                className="h-px bg-bronze-2 transition-all duration-700"
                style={{ width: i < active ? "100%" : "0%" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
