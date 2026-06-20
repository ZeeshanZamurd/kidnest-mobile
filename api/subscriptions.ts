import { apiRequest } from './client';

export type SubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  interval: 'MONTHLY' | 'YEARLY';
  priceCents: number;
  currency: string;
};

export type CheckoutResult =
  | { activated: true; subscription: unknown }
  | { activated: false; checkoutUrl: string; sessionId: string };

export async function fetchSubscriptionPlans() {
  return apiRequest<SubscriptionPlan[]>('/subscriptions/plans', 'GET');
}

/** Subscribe to a plan — dev bypass activates instantly; production opens Stripe checkout. */
export async function subscribeToPlan(planSlug: string): Promise<CheckoutResult> {
  return apiRequest<CheckoutResult>('/subscriptions/checkout', 'POST', {
    body: { planSlug },
  });
}

/** @deprecated Use subscribeToPlan — kept for compatibility */
export async function createCheckout(planSlug: string) {
  const res = await subscribeToPlan(planSlug);
  if (res.activated) {
    return { activated: true as const };
  }
  return { url: res.checkoutUrl, activated: false as const };
}
