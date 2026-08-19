/**
 * Places a real subscription through the live backend (API mode).
 *
 * Flow: ensure an account exists for the delivery phone (register, falling
 * back to login if the account already exists) -> resolve the product and
 * plan to their real backend ids by slug -> reuse a matching saved address
 * or create one -> create the subscription. Returns the backend-created
 * subscription so the UI can render server truth.
 */

import {
  ApiError,
  authRepository,
  customerRepository,
  getSessionToken,
  planRepository,
  productRepository,
  setSessionToken,
  subscriptionRepository,
} from "@/lib/api/repositories";
import type { Subscription } from "@/types/domain";
import type { SubscriptionDraft } from "@/components/subscription/CommerceProvider";

const PASSWORD_SUFFIX = "!emberPK";

export function accountPassword(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const core = digits.slice(-6);
  const password = `Ember${core}${PASSWORD_SUFFIX}`;
  return password.length >= 8 ? password : `Ember${core}2026!`;
}

export async function placeSubscription(
  draft: SubscriptionDraft,
): Promise<{ subscription: Subscription }> {
  const phone = draft.delivery.phone.trim();
  if (!phone) throw new ApiError(422, "Enter a phone number to place your subscription.");

  let token = getSessionToken();
  if (!token) {
    const password = accountPassword(phone);
    try {
      const auth = await authRepository.register({
        full_name: draft.delivery.fullName.trim(),
        phone,
        password,
      });
      token = auth.access_token;
      setSessionToken(token);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const auth = await authRepository.login({ identifier: phone, password });
        token = auth.access_token;
        setSessionToken(token);
      } else {
        throw err;
      }
    }
  }

  const product = await productRepository.getBySlug(draft.blendSlug);
  if (!product) throw new ApiError(404, "That coffee is unavailable right now.");

  const planList = await planRepository.list();
  const plan = planList.find((p) => p.slug === draft.frequencySlug);
  if (!plan) throw new ApiError(404, "That delivery schedule is unavailable right now.");

  const addresses = await customerRepository.listAddresses();
  const existing = addresses.find(
    (a) =>
      a.recipient_name === draft.delivery.fullName.trim() &&
      a.city === draft.delivery.city.trim() &&
      a.street_address === draft.delivery.street.trim(),
  );

  let addressId: number;
  if (existing) {
    addressId = existing.id;
  } else {
    const address = await customerRepository.createAddress({
      label: "Home",
      recipient_name: draft.delivery.fullName.trim(),
      phone,
      street_address: draft.delivery.street.trim(),
      city: draft.delivery.city.trim(),
    });
    addressId = address.id;
  }

  const subscription = await subscriptionRepository.create({
    planId: plan.id,
    productId: product.id,
    addressId,
    quantity: draft.quantity,
    autoRenew: true,
  });

  return { subscription };
}
