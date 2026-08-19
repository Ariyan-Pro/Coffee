"use client";

import { useCommerce } from "@/components/subscription/CommerceProvider";
import { grindOptions } from "@/components/subscription/CommerceProvider";
import { cn } from "@/lib/cn";

export function QuantitySelector() {
  const { draft, dispatch } = useCommerce();
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <span className="t-label text-[0.62rem] text-ink-3">Bags per delivery</span>
        <p className="t-body-s mt-1 text-ink-2">
          {draft.quantity} × 250g bag{draft.quantity > 1 ? "s" : ""}, {draft.quantity * 250}g of coffee
        </p>
      </div>
      <div className="flex items-center gap-3" aria-label="Bags per delivery">
        <button
          type="button"
          onClick={() => dispatch({ type: "setQuantity", qty: draft.quantity - 1 })}
          disabled={draft.quantity <= 1}
          aria-label="Decrease bags"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-cream text-lg text-ink transition-colors hover:border-bronze disabled:opacity-40"
        >
          −
        </button>
        <span className="w-8 text-center font-display text-2xl font-medium" aria-live="polite">
          {draft.quantity}
        </span>
        <button
          type="button"
          onClick={() => dispatch({ type: "setQuantity", qty: draft.quantity + 1 })}
          disabled={draft.quantity >= 4}
          aria-label="Increase bags"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-cream text-lg text-ink transition-colors hover:border-bronze disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function GrindSelector() {
  const { draft, dispatch } = useCommerce();
  return (
    <fieldset>
      <legend className="t-label text-[0.62rem] text-ink-3">Grind</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {grindOptions.map((opt) => {
          const selected = draft.grind === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => dispatch({ type: "setGrind", grind: opt.value })}
              aria-pressed={selected}
              className={cn(
                "rounded-full border px-4 py-2 text-[0.8rem] font-medium transition-all duration-200",
                selected
                  ? "border-mocha bg-mocha text-paper"
                  : "border-line bg-cream text-ink-2 hover:border-bronze",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {draft.grind === "WHOLE_BEAN" && (
        <p className="t-caption mt-3 text-ink-3">Whole bean keeps flavour longest. Grind at home.</p>
      )}
    </fieldset>
  );
}
