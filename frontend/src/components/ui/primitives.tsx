"use client";

/**
 * Design system primitives: Button, Badge, Container, Section, Heading,
 * Reveal. Shared vocabulary for every section.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/* ---- Button ---- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "light";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold tracking-wide transition-all duration-300 select-none " +
  "disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-3 " +
  "focus-visible:outline-bronze rounded-full";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-bronze text-paper hover:bg-ink hover:text-paper active:scale-[0.98] shadow-[0_1px_0_rgba(0,0,0,0.12)]",
  secondary:
    "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-paper active:scale-[0.98]",
  ghost: "text-ink hover:bg-ink/5",
  light:
    "bg-paper text-ink hover:bg-bronze-2 hover:text-ink active:scale-[0.98] shadow-[0_1px_0_rgba(0,0,0,0.15)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-[0.8rem]",
  md: "px-6 py-3 text-[0.875rem]",
  lg: "px-8 py-4 text-[0.9375rem]",
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
  onClick,
  type = "button",
  disabled,
  ariaLabel,
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if (href) {
    return (
      <Link href={href} onClick={onClick} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

/* ---- Badge ---- */

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-bronze/30 bg-bronze/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-bronze",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---- Container / Section ---- */

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("container-site", className)}>{children}</div>;
}

export function Section({
  children,
  className,
  id,
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative section-space",
        dark ? "bg-mocha text-paper" : "bg-transparent",
        className,
      )}
    >
      {children}
    </section>
  );
}

/* ---- Heading / Eyebrow ---- */

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={cn(
        "t-label flex items-center gap-3",
        dark ? "text-bronze-2" : "text-bronze",
      )}
    >
      <span aria-hidden className="h-px w-8 bg-current opacity-60" />
      {children}
    </p>
  );
}

export function Heading({
  as: Tag = "h2",
  size = "heading-xl",
  children,
  className,
}: {
  as?: "h1" | "h2" | "h3";
  size?: "display-xl" | "display-l" | "heading-xl" | "heading-l" | "heading-m";
  children: ReactNode;
  className?: string;
}) {
  const cls: Record<string, string> = {
    "display-xl": "t-display-xl",
    "display-l": "t-display-l",
    "heading-xl": "t-heading-xl",
    "heading-l": "t-heading-l",
    "heading-m": "t-heading-m",
  };
  return <Tag className={cn(cls[size], "balance", className)}>{children}</Tag>;
}

/* ---- Reveal (scroll entrance, reduced-motion aware) ---- */

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, y = 28, className }: RevealProps) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const activeReduce = mounted && reduce;
  return (
    <motion.div
      className={className}
      initial={activeReduce ? false : { opacity: 0, y }}
      whileInView={activeReduce ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ---- ScrollParallax (depth layer, moves slower than scroll) ---- */

interface ScrollParallaxProps {
  children: ReactNode;
  speed?: number; // 0 = fixed, 0.5 = half speed, 1 = normal scroll
  className?: string;
}

export function ScrollParallax({ children, speed = 0.3, className }: ScrollParallaxProps) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      style={{ y: `${(1 - speed) * 60}px` }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ---- Magnetic (micro-interaction: follows cursor) ---- */

interface MagneticProps {
  children: ReactNode;
  className?: string;
}

export function Magnetic({ children, className }: MagneticProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}

/* ---- Icon glyphs (minimal stroke set) ---- */

interface IconProps {
  className?: string;
}

export function IconArrow({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="none" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="none" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMenu({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconWhatsApp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.5-.3-2.7.7.7-2.6-.3-.5A8.2 8.2 0 0 1 12 3.8Zm-3 3.7c-.3 0-.7.1-1 .4-.3.4-.8 1.3-.7 2.6.2 1.6 1.5 3.1 3 4.3 1.5 1.2 3.4 2 4.6 2.3 1 .3 1.6-.1 2-.5.4-.3.4-.7.3-1l-.7-1.5c-.2-.3-.6-.4-1-.2l-.7.4c-.2.1-.5.1-.7-.1-.5-.3-1.4-.8-2.1-1.6-.6-.7-.8-1.1-.8-1.4 0-.2.1-.4.2-.6l.3-.5c.2-.2.2-.5.1-.8L13 9.3c-.2-.5-.5-.9-.9-1-.3 0-.6-.1-.8 0-.2 0-.3.1-.3.2Z" />
    </svg>
  );
}

/* ---- BronzeRule (decorative section divider) ---- */

export function BronzeRule({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-2", className)} aria-hidden>
      <div className="h-px w-16 bg-bronze/30" />
      <div className="mx-3 h-1.5 w-1.5 rotate-45 bg-bronze/40" />
      <div className="h-px w-16 bg-bronze/30" />
    </div>
  );
}
