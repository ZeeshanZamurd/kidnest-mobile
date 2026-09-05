import { getApiBaseUrl } from '../utils/resolveApiBaseUrl';
import { CacheManager, buildCacheKey, type CachePolicy } from '../services/cache';

export type ApiRequestError = Error & {
  status?: number;
  isNetworkError?: boolean;
  fromCache?: boolean;
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiRequestOptions = {
  body?: Record<string, unknown> | FormData;
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  _retried?: boolean;
  /** GET cache policy — stale-while-revalidate by default when set. */
  cache?: CachePolicy;
  cacheKey?: string;
  signal?: AbortSignal;
};

let authToken: string | null = null;
const inflightGet = new Map<string, Promise<unknown>>();

/** Avoid infinite spinners when the phone cannot reach the API host. */
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

export function getInflightRequestCount(): number {
  return inflightGet.size;
}

export function setApiAuthToken(token: string | null): void {
  authToken = token;
}

export function getApiAuthToken(): string | null {
  return authToken;
}

function toApiError(raw: unknown, fallbackMessage: string): ApiRequestError {
  const err = new Error(fallbackMessage) as ApiRequestError;
  if (raw && typeof raw === 'object') {
    const maybe = raw as { status?: number; message?: string };
    if (typeof maybe.status === 'number') err.status = maybe.status;
    // Prefer our detailed message; only keep server message when it adds status context
    if (
      typeof maybe.message === 'string' &&
      maybe.message.trim() &&
      maybe.message !== 'Network request failed' &&
      !fallbackMessage.startsWith('Network request failed')
    ) {
      err.message = maybe.message;
    }
  }
  err.isNetworkError = !err.status;
  return err;
}

export async function apiRequest<T = unknown>(
  path: string,
  method: HttpMethod = 'GET',
  options?: ApiRequestOptions,
): Promise<T> {
  if (method === 'GET' && options?.cache) {
    return cachedGet<T>(path, options);
  }
  return executeRequest<T>(path, method, options);
}

async function cachedGet<T>(path: string, options: ApiRequestOptions): Promise<T> {
  const policy = options.cache!;
  const key =
    options.cacheKey ??
    buildCacheKey(path, options.params as Record<string, unknown> | undefined);

  const cached = await CacheManager.get<T>(key, policy);
  const stale = cached != null && CacheManager.isStale(cached, policy);

  if (cached && !stale) {
    return cached.data;
  }

  if (cached && policy.staleWhileRevalidate) {
    void refreshCachedGet<T>(path, key, policy, options).catch(() => {});
    return cached.data;
  }

  return refreshCachedGet<T>(path, key, policy, options);
}

async function refreshCachedGet<T>(
  path: string,
  key: string,
  policy: CachePolicy,
  options: ApiRequestOptions,
): Promise<T> {
  const existing = inflightGet.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const task = executeRequest<T>(path, 'GET', options)
    .then(async (data) => {
      await CacheManager.set(key, data, policy);
      return data;
    })
    .finally(() => {
      inflightGet.delete(key);
    });

  inflightGet.set(key, task);
  return task;
}

async function executeRequest<T>(
  path: string,
  method: HttpMethod,
  options?: ApiRequestOptions,
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options?.headers,
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;
  if (options?.body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (__DEV__) {
    console.log('[API]', method, url.toString());
  }

  let response: Response;
  const requestUrl = url.toString();
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    DEFAULT_REQUEST_TIMEOUT_MS,
  );
  const onCallerAbort = () => timeoutController.abort();
  if (options?.signal) {
    if (options.signal.aborted) {
      timeoutController.abort();
    } else {
      options.signal.addEventListener('abort', onCallerAbort, { once: true });
    }
  }

  try {
    response = await fetch(requestUrl, {
      method,
      headers,
      signal: timeoutController.signal,
      body: options?.body
        ? isFormData
          ? (options.body as FormData)
          : JSON.stringify(options.body)
        : undefined,
    });
  } catch (error) {
    const aborted =
      (error instanceof Error && error.name === 'AbortError') ||
      timeoutController.signal.aborted;
    const detail = aborted
      ? `Timed out after ${DEFAULT_REQUEST_TIMEOUT_MS}ms`
      : error instanceof Error
        ? error.message
        : String(error);
    if (__DEV__) {
      console.error('[API] NETWORK FAIL', {
        method,
        url: requestUrl,
        baseUrl,
        detail,
        error,
      });
    }
    throw toApiError(
      error,
      `Network request failed\nURL: ${requestUrl}\nCause: ${detail}\nTip: run \`adb reverse tcp:3010 tcp:3010\` and keep Nest on :3010.`,
    );
  } finally {
    clearTimeout(timeoutId);
    options?.signal?.removeEventListener('abort', onCallerAbort);
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !options?._retried) {
      const { refreshIdToken } = await import('../services/authBootstrap');
      const freshToken = await refreshIdToken(true);
      if (freshToken) {
        return apiRequest<T>(path, method, { ...options, _retried: true });
      }
    }

    const message =
      (payload &&
        typeof payload === 'object' &&
        'message' in payload &&
        typeof (payload as { message: unknown }).message === 'string' &&
        (payload as { message: string }).message) ||
      (payload &&
        typeof payload === 'object' &&
        'message' in payload &&
        Array.isArray((payload as { message: unknown }).message) &&
        (payload as { message: string[] }).message.join(', ')) ||
      `Request failed (${response.status})`;
    if (__DEV__) {
      console.error('[API] HTTP ERROR', {
        method,
        url: requestUrl,
        status: response.status,
        message,
        payload,
      });
    }
    const err = toApiError({ status: response.status, message }, message);
    throw err;
  }

  return payload as T;
}

export { getApiBaseUrl };
