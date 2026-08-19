"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FaqItem } from "@/data/content";
import { cn } from "@/lib/cn";

export function FAQAccordion({
  items,
  title = "Questions, answered",
  dark = false,
}: {
  items: FaqItem[];
  title?: string;
  dark?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <h2 className={cn("t-heading-xl balance max-w-md", dark ? "text-paper" : "text-ink")}>{title}</h2>
        <p className={cn("t-body-m max-w-sm", dark ? "text-paper/60" : "text-ink-2")}>
          Everything people usually ask before their first order. Something else? We answer within a day.
        </p>
      </div>

      <div className="mt-10 border-t border-line/70">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="border-b border-line/70">
              <h3>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-trigger-${i}`}
                  className="group flex w-full items-center justify-between gap-6 py-5 text-left md:py-6"
                >
                  <span
                    className={cn(
                      "font-display text-lg font-medium tracking-tight transition-colors md:text-xl",
                      dark ? "text-paper group-hover:text-bronze-2" : "text-ink group-hover:text-bronze",
                    )}
                  >
                    {item.q}
                  </span>
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all duration-300",
                      isOpen
                        ? "rotate-45 border-bronze bg-bronze text-paper"
                        : dark
                          ? "border-paper/25 text-paper/70"
                          : "border-ink/20 text-ink/60",
                    )}
                    aria-hidden
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p
                      className={cn(
                        "t-body-m pretty max-w-2xl pb-6",
                        dark ? "text-paper/65" : "text-ink-2",
                      )}
                    >
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
