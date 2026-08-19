"use client";

import { useCommerce } from "@/components/subscription/CommerceProvider";
import { roastByLevel } from "@/data/products";
import { grindOptions } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Live order summary. Display values only — the backend remains the source
 * of truth for pricing at integration time.
 */
export function OrderSummary({ className }: { className?: string }) {
  const { draft, summary } = useCommerce();
  const { product, plan, quantity, grind, bagSubtotal, discountPercent, discountAmount, discountedSubtotal, deliveryFee, freeDelivery, total } = summary;

  const grindLabel = grindOptions.find((g) => g.value === grind)?.label ?? grind;

  return (
    <div className={cn("overflow-hidden rounded-lg border border-line bg-cream", className)}>
      <div className="border-b border-line px-6 py-5">
        <h2 className="t-label text-[0.66rem] text-ink-3">Your subscription</h2>
      </div>

      <dl className="space-y-4 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <dt className="t-body-s text-ink-2">Coffee</dt>
          <dd className="t-body-s text-right font-semibold text-ink">
            {product?.name ?? "Not selected"}
            <span className="mt-0.5 block font-normal text-ink-3">
              {roastByLevel[product?.roast_level ?? "MEDIUM"]} · {quantity} × 250g
            </span>
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="t-body-s text-ink-2">Schedule</dt>
          <dd className="t-body-s text-right font-semibold text-ink">
            {plan?.name ?? "Not selected"}
            <span className="mt-0.5 block font-normal text-ink-3">10-15% off each delivery</span>
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="t-body-s text-ink-2">Grind</dt>
          <dd className="t-body-s text-right font-semibold text-ink">{grindLabel}</dd>
        </div>
        {draft.delivery.street && (
          <div className="flex items-start justify-between gap-4">
            <dt className="t-body-s text-ink-2">Deliver to</dt>
            <dd className="t-body-s max-w-[60%] text-right text-ink">
              {draft.delivery.fullName}, {draft.delivery.city}
            </dd>
          </div>
        )}
      </dl>

      <div className="border-t border-line px-6 py-5">
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="t-caption text-ink-3">Bags subtotal</dt>
            <dd className="t-caption text-ink">{formatPrice(bagSubtotal)}</dd>
          </div>
          {discountPercent > 0 && (
            <div className="flex justify-between">
              <dt className="t-caption text-ink-3">Subscription discount ({discountPercent}%)</dt>
              <dd className="t-caption font-medium text-success">−{formatPrice(discountAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="t-caption text-ink-3">Delivery</dt>
            <dd className="t-caption text-ink">
              {freeDelivery ? (
                <span className="font-medium text-success">Free</span>
              ) : (
                formatPrice(deliveryFee)
              )}
            </dd>
          </div>
          {!freeDelivery && (
            <p className="t-caption text-ink-3">
              Add {formatPrice(5000 - discountedSubtotal)} more for free delivery.
            </p>
          )}
        </dl>

        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <dt className="t-body-m font-semibold text-ink">Total per delivery</dt>
          <dd className="font-display text-3xl font-medium text-ink">{formatPrice(total)}</dd>
        </div>
        <p className="t-caption mt-2 text-ink-3">
          Pay with JazzCash, EasyPaisa or cash on delivery. No lock-in. Pause or cancel anytime.
        </p>
      </div>
    </div>
  );
}
