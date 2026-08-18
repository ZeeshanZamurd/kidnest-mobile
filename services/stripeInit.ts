import { initStripe } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '../config/api';
import { fetchStripePublishableKey } from './stripeConfig';

const STRIPE_URL_SCHEME = 'kidnest';

async function resolvePublishableKey(explicitKey?: string): Promise<string> {
  const trimmed = explicitKey?.trim();
  if (trimmed) return trimmed;

  const fetched = await fetchStripePublishableKey();
  if (fetched) return fetched;

  const fallback = STRIPE_PUBLISHABLE_KEY.trim();
  if (fallback) return fallback;

  throw new Error(
    'Stripe is not configured. Set STRIPE_PUBLISHABLE_KEY on the server or in config/api.ts.',
  );
}

/** Ensures native PaymentConfiguration.init() ran before Payment Sheet. */
export async function ensureStripeInitialized(publishableKey?: string): Promise<string> {
  const key = await resolvePublishableKey(publishableKey);
  await initStripe({
    publishableKey: key,
    urlScheme: STRIPE_URL_SCHEME,
    setReturnUrlSchemeOnAndroid: true,
  });
  return key;
}
