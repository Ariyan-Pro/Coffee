"use client";

import { useCommerce } from "@/components/subscription/CommerceProvider";
import { ProductBag } from "@/components/art/ProductBag";
import { products, roastByLevel } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { IconCheck } from "@/components/ui/primitives";

export function BlendSelector() {
  const { draft, dispatch } = useCommerce();

  return (
    <fieldset>
      <legend className="sr-only">Choose your coffee</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.map((p) => {
          const selected = draft.blendSlug === p.slug;
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => dispatch({ type: "selectBlend", slug: p.slug })}
              aria-pressed={selected}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all duration-300",
                selected
                  ? "border-bronze bg-cream shadow-[0_0_0_1px_var(--color-bronze)]"
                  : "border-line bg-paper hover:border-bronze/50",
              )}
            >
              <div className="relative flex aspect-[4/3] items-center justify-center bg-paper-2 p-3">
                <ProductBag product={p} minimal className="h-full w-auto transition-transform duration-300 group-hover:scale-105" />
                {selected && (
                  <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-bronze text-paper">
                    <IconCheck className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <span className="t-label text-[0.58rem] text-bronze">{p.origin_country}</span>
                <span className="t-body-s font-semibold leading-tight text-ink">{p.name}</span>
                <span className="t-caption text-ink-3">
                  {roastByLevel[p.roast_level]} · {formatPrice(p.price_per_unit)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
