/**
 * API endpoint configuration.
 *
 * Production: set API_URL or API_DOMAIN below.
 * Development: leave both empty — the app uses Metro's connected host IP automatically.
 */
export const API_URL = 'https://api.kido-nest.fun/api';

/** Host only, e.g. api.kido-nest.fun — used when API_URL is empty. */
export const API_DOMAIN = '';

/** Use https when API_DOMAIN is set (set false for local domain testing). */
export const API_DOMAIN_USE_HTTPS = true;

/** KidNest API port on the dev machine (NestJS default). */
export const API_PORT = 3010;

/** NestJS global prefix. */
export const API_PREFIX = 'api';

/**
 * Optional Stripe publishable key fallback for local dev when /subscriptions/stripe-config
 * is unreachable. Copy from kidnest-api/.env STRIPE_PUBLISHABLE_KEY.
 */
export const STRIPE_PUBLISHABLE_KEY = '';
