"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Container, Reveal } from "@/components/ui/primitives";
import { getFeaturedProducts } from "@/data/products";
import type { Product } from "@/types/domain";
import { ProductCard } from "@/components/products/ProductCard";

export function FeaturedCoffee() {
  const featured = getFeaturedProducts();
  const reduce = useReducedMotion();

  return (
    <section className="section-space bg-paper">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal delay={0.08}>
              <h2 className="t-heading-xl balance max-w-xl">
                Four origins, currently on the bar.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <Link
              href="/coffee"
              className="t-body-s inline-flex items-center gap-2 font-semibold text-bronze transition-colors hover:text-ember"
            >
              View all six coffees
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </Reveal>
        </div>

        <div className="mt-12">
          <motion.ul
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            {featured.map((p) => (
              <motion.li
                key={p.slug}
                variants={{
                  hidden: reduce ? {} : { opacity: 0, y: 32, scale: 0.97 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
              >
                <ProductCard product={p} />
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </Container>
    </section>
  );
}
