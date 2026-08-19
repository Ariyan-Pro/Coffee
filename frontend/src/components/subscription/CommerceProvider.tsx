"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { configuratorPlans, products, getProductBySlug, grindOptions } from "@/data/products";
import { site } from "@/data/site";
import type { GrindOption } from "@/types/domain";

/* ---- Commerce state ---- */

export interface DeliveryInfo {
  fullName: string;
  phone: string;
  city: string;
  street: string;
  note: string;
}

export interface SubscriptionDraft {
  blendSlug: string;
  frequencySlug: string;
  quantity: number; // bags per delivery
  grind: GrindOption;
  delivery: DeliveryInfo;
}

type Action =
  | { type: "selectBlend"; slug: string }
  | { type: "selectFrequency"; slug: string }
  | { type: "setQuantity"; qty: number }
  | { type: "setGrind"; grind: GrindOption }
  | { type: "setDelivery"; field: keyof DeliveryInfo; value: string }
  | { type: "reset" };

const STORAGE_KEY = "ember-subscription-draft";

function initialDraft(): SubscriptionDraft {
  const fallback: SubscriptionDraft = {
    blendSlug: products[0]?.slug ?? "",
    frequencySlug: configuratorPlans[0]?.slug ?? "",
    quantity: 1,
    grind: "WHOLE_BEAN",
    delivery: { fullName: "", phone: "", city: "", street: "", note: "" },
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SubscriptionDraft>;
      return { ...fallback, ...parsed, delivery: { ...fallback.delivery, ...(parsed.delivery ?? {}) } };
    }
  } catch {
    /* corrupt storage — fall back */
  }
  return fallback;
}

function reducer(state: SubscriptionDraft, action: Action): SubscriptionDraft {
  switch (action.type) {
    case "selectBlend":
      return { ...state, blendSlug: action.slug };
    case "selectFrequency":
      return { ...state, frequencySlug: action.slug };
    case "setQuantity":
      return { ...state, quantity: Math.min(4, Math.max(1, action.qty)) };
    case "setGrind":
      return { ...state, grind: action.grind };
    case "setDelivery":
      return { ...state, delivery: { ...state.delivery, [action.field]: action.value } };
    case "reset":
      return initialDraft();
    default:
      return state;
  }
}

/* ---- Derived summary (display-only; backend is authoritative at integration) ---- */

export interface OrderSummaryLine {
  product: ReturnType<typeof getProductBySlug> | undefined;
  plan: (typeof configuratorPlans)[number] | undefined;
  quantity: number;
  grind: GrindOption;
  bagSubtotal: number;
  discountPercent: number;
  discountAmount: number;
  discountedSubtotal: number;
  deliveryFee: number;
  freeDelivery: boolean;
  total: number;
}

export function computeSummary(draft: SubscriptionDraft): OrderSummaryLine {
  const product = getProductBySlug(draft.blendSlug);
  const plan = configuratorPlans.find((p) => p.slug === draft.frequencySlug);
  const unit = product?.price_per_unit ?? 0;
  const bagSubtotal = unit * draft.quantity;
  const discountPercent = plan?.discount_percent ?? 0;
  const discountAmount = (bagSubtotal * discountPercent) / 100;
  const discountedSubtotal = bagSubtotal - discountAmount;
  const freeDelivery = discountedSubtotal >= site.shipping.freeDeliveryThreshold;
  const deliveryFee = freeDelivery ? 0 : site.shipping.deliveryFee;
  return {
    product,
    plan,
    quantity: draft.quantity,
    grind: draft.grind,
    bagSubtotal,
    discountPercent,
    discountAmount,
    discountedSubtotal,
    deliveryFee,
    freeDelivery,
    total: discountedSubtotal + deliveryFee,
  };
}

/* ---- Context ---- */

interface CommerceContextValue {
  draft: SubscriptionDraft;
  summary: OrderSummaryLine;
  dispatch: React.Dispatch<Action>;
}

const CommerceContext = createContext<CommerceContextValue | null>(null);

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(reducer, undefined, initialDraft);

  // Persist commerce state across navigations within the session.
  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* ignore quota errors */
    }
  }, [draft]);

  const summary = useMemo(() => computeSummary(draft), [draft]);
  const value = useMemo(() => ({ draft, summary, dispatch }), [draft, summary]);

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

export function useCommerce() {
  const ctx = useContext(CommerceContext);
  if (!ctx) throw new Error("useCommerce must be used within CommerceProvider");
  return ctx;
}

export { grindOptions };
