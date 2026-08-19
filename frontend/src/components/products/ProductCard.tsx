"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useReducedMotion } from "framer-motion";
import type { Product } from "@/types/domain";
import { ProductBag } from "@/components/art/ProductBag";
import { roastByLevel } from "@/data/products";
import { formatPrice } from "@/lib/format";

/**
 * Editorial product card with 3D depth on hover.
 * Reads like a catalogue plate with tactile interaction.
 */
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useTransform(mouseY, [0, 1], [4, -4]);
  const rotateY = useTransform(mouseX, [0, 1], [-4, 4]);
  const glareOpacity = useTransform(mouseX, [0, 0.5, 1], [0.06, 0.02, 0.06]);

  function handleMouseMove(e: React.MouseEvent) {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseEnter() { setHovered(true); }
  function handleMouseLeave() {
    setHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  return (
    <motion.div
      style={reduce || !hovered ? {} : { rotateX, rotateY, transformPerspective: 800 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Link
        ref={ref}
        href={`/coffee/${product.slug}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-cream transition-all duration-500 hover:border-bronze/40 hover:shadow-[0_24px_60px_-32px_rgba(29,23,18,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
      >
        <div className="relative aspect-[5/4] overflow-hidden bg-paper-2">
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <ProductBag
              product={product}
              minimal
              className="h-full w-auto transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
            />
          </div>
          {/* glare overlay */}
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"
            style={{ opacity: reduce ? 0 : glareOpacity }}
          />
          {/* roast tag */}
          <span className="absolute left-4 top-4 rounded-full bg-mocha/85 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-paper backdrop-blur-sm">
            {roastByLevel[product.roast_level]}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
          <div>
            <p className="t-label text-[0.66rem] text-bronze">{product.origin_country}</p>
            <h3 className="font-display mt-1.5 text-xl font-medium leading-snug tracking-tight">
              {product.name}
            </h3>
          </div>

          <ul className="flex flex-wrap gap-x-3 gap-y-1" aria-label="Tasting notes">
            {product.flavor_notes.map((n) => (
              <li key={n} className="t-caption text-ink-2">
                {n}
              </li>
            ))}
          </ul>

          <div className="mt-auto flex items-end justify-between border-t border-line pt-4">
            <div>
              <p className="t-label text-[0.62rem] text-ink-3">{product.weight_grams}g · whole bean</p>
              <p className="t-heading-m mt-1 font-display text-lg font-medium">{formatPrice(product.price_per_unit)}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-bronze transition-colors group-hover:text-ember">
              View
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
