"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { cn } from "@/lib/cn";
import { site } from "@/data/site";
import { Button, IconClose, IconMenu } from "@/components/ui/primitives";

const WORDMARK = "EMBER";

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="group inline-flex items-center gap-2.5"
      aria-label={`${site.name} home`}
    >
      <span aria-hidden className="relative grid h-8 w-8 place-items-center">
        <svg viewBox="0 0 64 64" className="h-8 w-8">
          <circle cx="32" cy="32" r="30" fill="currentColor" />
          <ellipse cx="32" cy="32" rx="16" ry="10.5" transform="rotate(-24 32 32)" fill="var(--logo-bean, #9c6b3a)" />
          <path
            d="M 28 25 C 33 32 35 41 38 47"
            fill="none"
            stroke="var(--logo-crease, #241b13)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="font-display text-lg font-semibold tracking-[0.28em]">{WORDMARK}</span>
    </Link>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 60);
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const light = scrolled; // solid paper after scroll; transparent (dark hero) before

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          light
            ? "border-b border-line bg-paper/90 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
        style={{
          color: light ? "var(--color-ink)" : "var(--color-paper)",
          // keep the logo bean readable in both states
          ["--logo-bean" as string]: light ? "#9c6b3a" : "#c29b63",
          ["--logo-crease" as string]: light ? "#241b13" : "#241b13",
        }}
      >
        <div className="container-site flex h-[68px] items-center justify-between gap-6">
          <Logo />

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "t-body-s font-medium transition-opacity hover:opacity-70",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button href="/subscribe" size="sm" variant={light ? "primary" : "light"}>
              Subscribe
            </Button>
          </div>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-black/5 md:hidden"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Open menu"
          >
            <IconMenu />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="absolute inset-0 bg-mocha/95 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              className="relative flex h-full flex-col bg-mocha text-paper"
              initial={{ y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              <div className="container-site flex h-[68px] items-center justify-between">
                <Logo onClick={() => setOpen(false)} />
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                >
                  <IconClose />
                </button>
              </div>

              <nav className="container-site flex flex-1 flex-col justify-center gap-2" aria-label="Mobile">
                {site.nav.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 * i + 0.1, duration: 0.35 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="font-display block py-3 text-4xl font-medium tracking-tight transition-colors hover:text-bronze-2"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  className="mt-8"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.34, duration: 0.35 }}
                >
                  <Button href="/subscribe" size="lg" variant="light" onClick={() => setOpen(false)}>
                    Subscribe Now
                  </Button>
                </motion.div>
              </nav>

              <div className="container-site pb-10 t-caption text-paper/50">
                {site.contact.hours}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
