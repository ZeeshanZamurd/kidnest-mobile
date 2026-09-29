import { Platform } from 'react-native';
import { API_DOMAIN, API_DOMAIN_USE_HTTPS, API_PORT, API_PREFIX, API_URL } from '../config/api';
import { DEV_HOST_IP } from '../config/dev-host.generated';
import { getMetroDevHost } from './getMetroDevHost';

/** Live API — always used for release / TestFlight / Play Store builds. */
export const PRODUCTION_API_URL = 'https://api.kido-nest.fun/api';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function buildFromDomain(domain: string): string {
  const host = domain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  const scheme = API_DOMAIN_USE_HTTPS ? 'https' : 'http';
  return `${scheme}://${host}/${API_PREFIX}`;
}

function buildFromHost(host: string): string {
  return `http://${host}:${API_PORT}/${API_PREFIX}`;
}

/**
 * Release builds always use the production API (no localhost / adb / Metro).
 * Dev builds: API_URL if set, else local Nest discovery.
 */
export function resolveApiBaseUrl(): string {
  // Production / release: hard-wired — never fall back to device localhost.
  if (!__DEV__) {
    return PRODUCTION_API_URL;
  }

  const explicitUrl = API_URL.trim();
  if (explicitUrl) {
    return trimTrailingSlash(explicitUrl);
  }

  const domain = API_DOMAIN.trim();
  if (domain) {
    return buildFromDomain(domain);
  }

  if (Platform.OS === 'android') {
    return buildFromHost('localhost');
  }

  const metroHost = getMetroDevHost();
  if (
    metroHost &&
    metroHost !== 'localhost' &&
    metroHost !== '127.0.0.1' &&
    metroHost !== '10.0.2.2'
  ) {
    return buildFromHost(metroHost);
  }

  const generatedHost = DEV_HOST_IP?.trim();
  if (generatedHost && generatedHost !== '127.0.0.1') {
    return buildFromHost(generatedHost);
  }

  if (Platform.OS === 'android') {
    return buildFromHost('10.0.2.2');
  }

  return buildFromHost('localhost');
}

/** Call after changing API config at runtime (rare). */
export function resetApiBaseUrlCache(): void {
  // no-op: base URL is resolved fresh each call
}

export function getApiBaseUrl(): string {
  return resolveApiBaseUrl();
}
