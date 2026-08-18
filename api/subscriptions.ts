import { apiRequest } from './client';

export type SubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  interval: 'MONTHLY' | 'YEARLY';
  priceCents: number;
  currency: string;
  maxChildren: number;
  maxChannels: number;
  maxVideos: number;
  maxAssignments: number;
};

export type PlanLimits = {
  maxChildren: number;
  maxChannels: number;
  maxVideos: number;
  maxAssignments: number;
  isPremium: boolean;
};

export type SubscriptionUsage = {
  children: number;
  assignments: number;
  channels: number;
};

export type SubscriptionStatusResponse = {
  hasSubscription: boolean;
  limits: PlanLimits;
  usage: SubscriptionUsage;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string | null;
    plan: SubscriptionPlan;
  } | null;
};

export type CheckoutResult = {
  checkoutUrl: string;
  sessionId: string;
};

export type PaymentSheetParams = {
  paymentIntentClientSecret: string;
  ephemeralKey: string;
  customerId: string;
  subscriptionId: string;
  publishableKey: string;
};

export type ConfirmPaymentResult =
  | ({ activated: true } & SubscriptionStatusResponse)
  | { activated: false; status: string };

export async function fetchSubscriptionPlans() {
  return apiRequest<SubscriptionPlan[]>('/subscriptions/plans', 'GET');
}

export async function fetchSubscriptionStatus() {
  return apiRequest<SubscriptionStatusResponse>('/subscriptions/status', 'GET');
}

export async function subscribeToPlan(planSlug: string): Promise<CheckoutResult> {
  return apiRequest<CheckoutResult>('/subscriptions/checkout', 'POST', {
    body: { planSlug },
  });
}

export async function verifyCheckoutSession(sessionId: string) {
  return apiRequest<SubscriptionStatusResponse>('/subscriptions/verify-session', 'POST', {
    body: { sessionId },
  });
}

export async function createPaymentSheet(planSlug: string) {
  return apiRequest<PaymentSheetParams>('/subscriptions/payment-sheet', 'POST', {
    body: { planSlug },
  });
}

export async function confirmStripePayment(subscriptionId: string) {
  return apiRequest<ConfirmPaymentResult>('/subscriptions/confirm-payment', 'POST', {
    body: { subscriptionId },
  });
}

export async function redeemPromoCode(code: string) {
  return apiRequest<{ id: string; status: string; currentPeriodEnd: string | null; plan: SubscriptionPlan }>(
    '/subscriptions/redeem',
    'POST',
    { body: { code } },
  );
}

export const PREMIUM_FEATURES = [
  'Ad-free experience for your family',
  'Unlimited channels & video assignments',
  'Access to premium channels & new content',
  'Child activity & watch history insights',
  'Personalized content by child interests',
  'Multiple child profiles with screen limits',
] as const;
