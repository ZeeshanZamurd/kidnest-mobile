/**
 * API endpoint configuration.
 *
 * Release builds (!__DEV__) always use https://api.kido-nest.fun/api
 * (see resolveApiBaseUrl) — these values are ignored in production builds.
 *
 * Local Metro (__DEV__): leave API_URL and API_DOMAIN empty so the app uses
 * adb reverse / LAN Nest on :3010.
 * To hit production from Metro temporarily, set:
 *   API_URL = 'https://api.kido-nest.fun/api'
 */
export const API_URL = '';

/** Host only — used when API_URL is empty (dev). Leave empty for local Nest. */
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
