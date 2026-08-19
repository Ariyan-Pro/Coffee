"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";

/**
 * Persistent-but-restrained conversion entry that appears after the hero.
 * Bottom-left so it never collides with the WhatsApp entry (bottom-right).
 */
export function FloatingCTA() {
  const [visible, setVisible] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 900);
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-5 left-5 z-40 hidden sm:block"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/subscribe"
            className="group inline-flex items-center gap-2.5 rounded-full bg-mocha px-6 py-3.5 text-paper shadow-xl shadow-black/15 transition-all hover:bg-ink"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-bronze-2 text-ink">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </span>
            <span className="t-body-s font-semibold">Start your subscription</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
