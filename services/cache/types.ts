export const CACHE_VERSION = 1;

/** Default API cache TTL — 5 minutes. */
export const DEFAULT_API_TTL_MS = 5 * 60 * 1000;

/** Long-lived taxonomy/settings — 24 hours. */
export const LONG_API_TTL_MS = 24 * 60 * 60 * 1000;

/** Child feed/library — 10 minutes, revalidate in background. */
export const FEED_API_TTL_MS = 10 * 60 * 1000;

/** Target video disk cache budget (react-native-video native cache). */
export const DEFAULT_VIDEO_CACHE_MB = 2048;

/** Max in-memory image URIs tracked for prefetch dedupe. */
export const IMAGE_MEMORY_CACHE_MAX = 500;

export type CacheEntry<T> = {
  v: number;
  data: T;
  fetchedAt: number;
};

export type CachePolicy = {
  /** Time until data is considered stale. */
  ttlMs: number;
  /** Return stale data immediately and refresh in background. */
  staleWhileRevalidate?: boolean;
  /** Persist to AsyncStorage (survives restarts). */
  persist?: boolean;
};

export type CacheStats = {
  memoryEntries: number;
  persistedKeys: number;
  imagePrefetchHits: number;
  imagePrefetchMisses: number;
  apiCacheHits: number;
  apiCacheMisses: number;
  inflightRequests: number;
};
