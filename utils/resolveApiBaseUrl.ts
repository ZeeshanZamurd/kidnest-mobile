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

/**
 * Resolves API base URL:
 * 1. API_URL if set
 * 2. API_DOMAIN if set
 * 3. Android USB: localhost via `adb reverse tcp:3010 tcp:3010` (most reliable)
 * 4. Metro LAN host (same Wi‑Fi)
 * 5. Generated LAN IP from detect-host script
 * 6. Android emulator host loopback (10.0.2.2)
 * 7. localhost (iOS simulator fallback)
 *
 * Prefer USB reverse over Metro LAN — office Wi‑Fi often blocks phone→Mac:3010
 * even when Metro bundles load.
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

  // Physical Android / emulator with `adb reverse`: device localhost → host Nest
  if (Platform.OS === 'android' && __DEV__) {
    const usbUrl = buildFromHost('localhost');
    if (__DEV__) {
      console.log('[KidNest API] Using Android localhost (adb reverse):', usbUrl);
    }
    return usbUrl;
  }

  const metroHost = getMetroDevHost();
  if (
    metroHost &&
    metroHost !== 'localhost' &&
    metroHost !== '127.0.0.1' &&
    metroHost !== '10.0.2.2'
  ) {
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

  if (Platform.OS === 'android') {
    const emulatorUrl = buildFromHost('10.0.2.2');
    if (__DEV__) {
      console.log('[KidNest API] Using Android emulator host:', emulatorUrl);
    }
    return emulatorUrl;
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
