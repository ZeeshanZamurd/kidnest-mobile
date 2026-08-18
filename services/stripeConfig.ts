import { getApiBaseUrl } from '../api/client';

let cachedPublishableKey: string | null | undefined;

export async function fetchStripePublishableKey(): Promise<string | null> {
  if (cachedPublishableKey !== undefined) {
    return cachedPublishableKey;
  }
  try {
    const res = await fetch(`${getApiBaseUrl()}/subscriptions/stripe-config`);
    if (!res.ok) {
      cachedPublishableKey = null;
      return null;
    }
    const data = (await res.json()) as { publishableKey?: string | null };
    cachedPublishableKey = data.publishableKey?.trim() || null;
    return cachedPublishableKey;
  } catch {
    cachedPublishableKey = null;
    return null;
  }
}
