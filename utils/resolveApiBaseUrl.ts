import { Platform } from 'react-native';
import { API_DOMAIN, API_DOMAIN_USE_HTTPS, API_PORT, API_PREFIX, API_URL } from '../config/api';
import { DEV_HOST_IP } from '../config/dev-host.generated';
import { getMetroDevHost } from './getMetroDevHost';

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

/** USB debugging: `adb reverse tcp:3010 tcp:3010` then device can use localhost for API. */
function androidUsbReverseBaseUrl(): string | null {
  if (Platform.OS !== 'android') return null;
  return buildFromHost('localhost');
}

/**
 * Resolves API base URL:
 * 1. API_URL if set
 * 2. API_DOMAIN if set
 * 3. Metro dev server host (same machine as the JS bundle)
 * 4. Generated LAN IP from detect-host script
 * 5. Android USB localhost (requires adb reverse on port 3010)
 * 6. localhost (iOS simulator fallback)
 */
export function resolveApiBaseUrl(): string {
  const explicitUrl = API_URL.trim();
  if (explicitUrl) {
    return trimTrailingSlash(explicitUrl);
  }

  const domain = API_DOMAIN.trim();
  if (domain) {
    return buildFromDomain(domain);
  }

  const metroHost = getMetroDevHost();
  if (metroHost) {
    const url = buildFromHost(metroHost);
    if (__DEV__) {
      console.log('[KidNest API] Using Metro host:', url);
    }
    return url;
  }

  const generatedHost = DEV_HOST_IP?.trim();
  if (generatedHost && generatedHost !== '127.0.0.1') {
    const url = buildFromHost(generatedHost);
    if (__DEV__) {
      console.log('[KidNest API] Using detected LAN IP:', url);
    }
    return url;
  }

  const usbUrl = androidUsbReverseBaseUrl();
  if (usbUrl) {
    if (__DEV__) {
      console.log('[KidNest API] Using Android localhost (adb reverse):', usbUrl);
    }
    return usbUrl;
  }

  const fallback = buildFromHost('localhost');
  if (__DEV__) {
    console.log('[KidNest API] Fallback:', fallback);
  }
  return fallback;
}

/** Call after changing API config at runtime (rare). */
export function resetApiBaseUrlCache(): void {
  // no-op: base URL is resolved fresh each call
}

export function getApiBaseUrl(): string {
  return resolveApiBaseUrl();
}
