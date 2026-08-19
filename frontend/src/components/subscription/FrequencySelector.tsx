"use client";

import { useCommerce } from "@/components/subscription/CommerceProvider";
import { configuratorPlans } from "@/data/products";
import { cn } from "@/lib/cn";
import { IconCheck } from "@/components/ui/primitives";

export function FrequencySelector() {
  const { draft, dispatch } = useCommerce();

  return (
    <fieldset>
      <legend className="sr-only">Choose your delivery schedule</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {configuratorPlans.map((plan) => {
          const selected = draft.frequencySlug === plan.slug;
          return (
            <button
              key={plan.slug}
              type="button"
              onClick={() => dispatch({ type: "selectFrequency", slug: plan.slug })}
              aria-pressed={selected}
              className={cn(
                "flex items-start justify-between gap-4 rounded-lg border p-5 text-left transition-all duration-300",
                selected
                  ? "border-bronze bg-cream shadow-[0_0_0_1px_var(--color-bronze)]"
                  : "border-line bg-paper hover:border-bronze/50",
              )}
            >
              <div>
                <span className="font-display text-lg font-medium tracking-tight text-ink">{plan.name}</span>
                <span className="t-caption mt-1 block text-ink-3">{plan.description}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="rounded-full bg-bronze/10 px-2.5 py-0.5 text-[0.7rem] font-bold text-bronze">
                  {plan.discount_percent}% off
                </span>
                {selected && <IconCheck className="h-4 w-4 text-bronze" />}
              </div>
            </button>
          );
        })}
      </div>
      <p className="t-caption mt-4 text-ink-3">
        Delivery day is set from your order confirmation, typically 3-5 days after roasting.
      </p>
    </fieldset>
  );
}
