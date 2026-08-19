"use client";

import { useSearchParams } from "next/navigation";
import { SubscriptionConfigurator } from "@/components/subscription/SubscriptionConfigurator";

export function SubscriptionConfiguratorWithParams() {
  const params = useSearchParams();
  return <SubscriptionConfigurator initialBlendSlug={params.get("blend") ?? undefined} />;
}
