"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCommerce } from "@/components/subscription/CommerceProvider";
import { BlendSelector } from "@/components/subscription/BlendSelector";
import { FrequencySelector } from "@/components/subscription/FrequencySelector";
import { QuantitySelector, GrindSelector } from "@/components/subscription/QuantitySelector";
import { DeliveryForm, validateDelivery } from "@/components/subscription/DeliveryForm";
import { OrderSummary } from "@/components/subscription/OrderSummary";
import { Button, IconCheck, IconArrow } from "@/components/ui/primitives";
import { getProductBySlug } from "@/data/products";
import { site, whatsappLink } from "@/data/site";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ApiError, MOCK_MODE } from "@/lib/api/repositories";
import { placeSubscription } from "@/lib/api/subscribe";

const steps = [
  { id: "blend", label: "Blend" },
  { id: "schedule", label: "Schedule" },
  { id: "delivery", label: "Delivery" },
  { id: "review", label: "Review" },
] as const;

type StepId = (typeof steps)[number]["id"];
type Status = "idle" | "loading" | "success";

export function SubscriptionConfigurator({ initialBlendSlug }: { initialBlendSlug?: string }) {
  const { draft, summary, dispatch } = useCommerce();
  const [step, setStep] = useState<StepId>("blend");
  const [status, setStatus] = useState<Status>("idle");
  const [orderNumber, setOrderNumber] = useState("");
  const [nextDelivery, setNextDelivery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = steps.findIndex((s) => s.id === step);

  // Preselect from ?blend=...
  useEffect(() => {
    if (initialBlendSlug && getProductBySlug(initialBlendSlug)) {
      dispatch({ type: "selectBlend", slug: initialBlendSlug });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBlendSlug]);

  const validateStep = (id: StepId): boolean => {
    if (id === "blend") return Boolean(getProductBySlug(draft.blendSlug));
    if (id === "schedule") return true;
    if (id === "delivery") return Object.keys(validateDelivery(draft.delivery)).length === 0;
    return true;
  };

  const go = (target: StepId) => {
    setError(null);
    if (stepIndex < steps.findIndex((s) => s.id === target)) {
      if (!validateStep(step)) {
        if (step === "delivery") {
          const errs = validateDelivery(draft.delivery);
          setError(errs.phone ?? errs.fullName ?? errs.city ?? errs.street ?? "Please complete this step.");
        }
        return;
      }
    }
    setStep(target);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (status !== "idle") return;
    setStatus("loading");
    setError(null);
    try {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 1100));
        setOrderNumber(`EMBER-${Date.now().toString().slice(-6)}`);
        setNextDelivery(null);
        setStatus("success");
        return;
      }
      const { subscription } = await placeSubscription(draft);
      setOrderNumber(`#${subscription.id}`);
      setNextDelivery(subscription.next_delivery_date);
      setStatus("success");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
      setStatus("idle");
    }
  };

  const waMessage = orderNumber
    ? `Hi EMBER, I've placed a new subscription (order ${orderNumber}) for ${summary.product?.name}. Please confirm my first delivery.`
    : "";
  const waHref = whatsappLink(waMessage);

  /* ---- Success state ---- */
  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-xl rounded-lg border border-line bg-cream p-8 text-center md:p-12"
        role="status"
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15">
          <IconCheck className="h-7 w-7 text-success" />
        </span>
        <h2 className="t-heading-l mt-6">Subscription received.</h2>
        <p className="t-body-m pretty mt-3 text-ink-2">
          Reference <span className="font-semibold text-ink">{orderNumber}</span>. We roast{" "}
          {summary.product?.name} after your order is confirmed and we will reach out to confirm
          your first delivery within a day.
        </p>

        <dl className="mt-8 space-y-2 rounded-lg bg-paper px-6 py-5 text-left">
          <div className="flex justify-between">
            <dt className="t-caption text-ink-3">Coffee</dt>
            <dd className="t-caption text-ink">{summary.product?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="t-caption text-ink-3">Schedule</dt>
            <dd className="t-caption text-ink">{summary.plan?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="t-caption text-ink-3">Deliver to</dt>
            <dd className="t-caption text-ink">
              {draft.delivery.city}, {draft.delivery.fullName}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2">
            <dt className="t-caption text-ink-3">
              {MOCK_MODE ? "Total (this delivery)" : "Next delivery"}
            </dt>
            <dd className="t-caption font-semibold text-ink">
              {MOCK_MODE ? formatPrice(summary.total) : nextDelivery ? formatDate(nextDelivery) : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {waHref && (
            <Button href={waHref} variant="secondary">
              Confirm faster on WhatsApp
            </Button>
          )}
          <Button href="/coffee">Continue shopping</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      {/* Steps */}
      <div className="lg:col-span-7">
        {/* Stepper */}
        <ol className="mb-10 flex items-center gap-3" aria-label="Progress">
          {steps.map((s, i) => {
            const active = step === s.id;
            const done = i < stepIndex;
            return (
              <li key={s.id} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => done && go(s.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-1 py-1 transition-opacity",
                    done ? "cursor-pointer hover:opacity-80" : "cursor-default",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full text-[0.7rem] font-bold transition-colors duration-300",
                      active
                        ? "bg-bronze text-paper"
                        : done
                          ? "bg-success/15 text-success"
                          : "bg-paper text-ink-3 ring-1 ring-line",
                    )}
                  >
                    {done ? <IconCheck className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "hidden t-caption font-semibold sm:inline",
                      active ? "text-ink" : "text-ink-3",
                    )}
                  >
                    {s.label}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <span className="hidden h-px w-6 bg-line sm:block sm:w-10" aria-hidden />
                )}
              </li>
            );
          })}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === "blend" && (
              <div className="space-y-6">
                <StepHeading
                  index="01"
                  title="Choose your blend"
                  copy="Six single-origin lots. Every one is roasted to order after you confirm."
                />
                <BlendSelector />
              </div>
            )}

            {step === "schedule" && (
              <div className="space-y-10">
                <StepHeading
                  index="02"
                  title="Set your schedule"
                  copy="Weekly for steady supply, monthly for a considered cup. Discounts apply automatically."
                />
                <FrequencySelector />
                <div className="border-t border-line pt-8">
                  <QuantitySelector />
                </div>
                <div className="border-t border-line pt-8">
                  <GrindSelector />
                </div>
              </div>
            )}

            {step === "delivery" && (
              <div className="space-y-6">
                <StepHeading
                  index="03"
                  title="Where should we deliver?"
                  copy="Dispatched within 48 hours of roasting, via national courier."
                />
                <DeliveryForm />
              </div>
            )}

            {step === "review" && (
              <div className="space-y-6">
                <StepHeading
                  index="04"
                  title="One last look"
                  copy="Confirm your coffee, schedule and delivery details below."
                />
                <OrderSummary className="lg:hidden" />
                <div className="rounded-lg border border-line bg-cream px-6 py-5">
                  <h3 className="t-label text-[0.66rem] text-ink-3">Payment on delivery</h3>
                  <p className="t-body-s mt-2 text-ink-2">
                    JazzCash, EasyPaisa or cash on delivery. Final payment is confirmed by our team
                    before your first roast.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-md border border-error/30 bg-error/10 px-4 py-3"
          >
            <p className="t-body-s text-error">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              setError(null);
              const idx = stepIndex - 1;
              if (idx >= 0) setStep(steps[idx].id);
            }}
            disabled={stepIndex === 0}
          >
            ← Back
          </Button>

          {step === "review" ? (
            <Button size="lg" onClick={submit} disabled={status === "loading"}>
              {status === "loading" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/30 border-t-paper" aria-hidden />
                  Placing…
                </>
              ) : (
                <>
                  Start subscription <IconArrow />
                </>
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => {
                const idx = stepIndex + 1;
                if (idx < steps.length) go(steps[idx].id);
              }}
            >
              Continue <IconArrow />
            </Button>
          )}
        </div>

        <p className="t-caption mt-6 text-ink-3">
          No contracts, no minimum commitment. Pause, skip or cancel from your account anytime.
        </p>
      </div>

      {/* Live summary (desktop) */}
      <aside className="hidden lg:col-span-5 lg:block">
        <div className="lg:sticky lg:top-28">
          <OrderSummary />
        </div>
      </aside>
    </div>
  );
}

function StepHeading({ index, title, copy }: { index: string; title: string; copy: string }) {
  return (
    <div>
      <p className="t-label flex items-center gap-3 text-bronze">
        <span aria-hidden className="h-px w-6 bg-bronze/50" />
        Step {index}
      </p>
      <h2 className="t-heading-l mt-4">{title}</h2>
      <p className="t-body-m mt-3 max-w-md text-ink-2">{copy}</p>
    </div>
  );
}
