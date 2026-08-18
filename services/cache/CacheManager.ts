import AsyncStorage from '@react-native-async-storage/async-storage';
import { LruMap } from './lruMap';
import {
  CACHE_VERSION,
  DEFAULT_VIDEO_CACHE_MB,
  IMAGE_MEMORY_CACHE_MAX,
  type CacheEntry,
  type CachePolicy,
  type CacheStats,
} from './types';

const PERSIST_PREFIX = `@kidnest/cache/v${CACHE_VERSION}/`;
const PERSIST_INDEX_KEY = `${PERSIST_PREFIX}__index__`;

class CacheManagerImpl {
  private readonly memory = new LruMap<string, CacheEntry<unknown>>(300);
  private persistIndex = new Set<string>();
  private persistLoaded = false;

  private imagePrefetchDone = new LruMap<string, true>(IMAGE_MEMORY_CACHE_MAX);
  private apiHits = 0;
  private apiMisses = 0;
  private imageHits = 0;
  private imageMisses = 0;

  readonly videoCacheSizeMB = DEFAULT_VIDEO_CACHE_MB;

  async init(): Promise<void> {
    await this.loadPersistIndex();
    void this.clearExpiredPersisted();
  }

  getMemory<T>(key: string): CacheEntry<T> | null {
    const hit = this.memory.get(key);
    return (hit as CacheEntry<T> | undefined) ?? null;
  }

  setMemory<T>(key: string, data: T): void {
    this.memory.set(key, { v: CACHE_VERSION, data, fetchedAt: Date.now() });
  }

  async get<T>(key: string, policy?: CachePolicy): Promise<CacheEntry<T> | null> {
    const mem = this.getMemory<T>(key);
    if (mem && this.isFresh(mem, policy)) {
      this.apiHits += 1;
      return mem;
    }

    if (policy?.persist) {
      const disk = await this.getPersisted<T>(key);
      if (disk && this.isFresh(disk, policy)) {
        this.memory.set(key, disk);
        this.apiHits += 1;
        return disk;
      }
    }

    this.apiMisses += 1;
    return mem ?? null;
  }

  async set<T>(key: string, data: T, policy?: CachePolicy): Promise<void> {
    const entry: CacheEntry<T> = { v: CACHE_VERSION, data, fetchedAt: Date.now() };
    this.memory.set(key, entry);
    if (policy?.persist) {
      await this.setPersisted(key, entry);
    }
  }

  invalidate(key: string): void {
    this.memory.delete(key);
    void this.removePersisted(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.memory.keys()) {
      if (key.startsWith(prefix)) this.memory.delete(key);
    }
    const toRemove = [...this.persistIndex].filter((k) => k.startsWith(prefix));
    void Promise.all(toRemove.map((k) => this.removePersisted(k)));
  }

  isFresh(entry: CacheEntry<unknown>, policy?: CachePolicy): boolean {
    if (entry.v !== CACHE_VERSION) return false;
    if (!policy?.ttlMs) return true;
    return Date.now() - entry.fetchedAt < policy.ttlMs;
  }

  isStale(entry: CacheEntry<unknown>, policy?: CachePolicy): boolean {
    if (!policy?.ttlMs) return false;
    return Date.now() - entry.fetchedAt >= policy.ttlMs;
  }

  markImagePrefetched(uri: string): boolean {
    if (!uri) return false;
    if (this.imagePrefetchDone.get(uri)) {
      this.imageHits += 1;
      return true;
    }
    this.imageMisses += 1;
    this.imagePrefetchDone.set(uri, true);
    return false;
  }

  getStats(inflightRequests = 0): CacheStats {
    return {
      memoryEntries: this.memory.size,
      persistedKeys: this.persistIndex.size,
      imagePrefetchHits: this.imageHits,
      imagePrefetchMisses: this.imageMisses,
      apiCacheHits: this.apiHits,
      apiCacheMisses: this.apiMisses,
      inflightRequests,
    };
  }

  async clearAll(): Promise<void> {
    this.memory.clear();
    this.imagePrefetchDone.clear();
    const keys = [...this.persistIndex];
    this.persistIndex.clear();
    await Promise.all(keys.map((k) => AsyncStorage.removeItem(PERSIST_PREFIX + k)));
    await AsyncStorage.removeItem(PERSIST_INDEX_KEY);
  }

  private async loadPersistIndex(): Promise<void> {
    if (this.persistLoaded) return;
    try {
      const raw = await AsyncStorage.getItem(PERSIST_INDEX_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        this.persistIndex = new Set(parsed);
      }
    } catch {
      this.persistIndex = new Set();
    }
    this.persistLoaded = true;
  }

  private async savePersistIndex(): Promise<void> {
    await AsyncStorage.setItem(PERSIST_INDEX_KEY, JSON.stringify([...this.persistIndex]));
  }

  private async getPersisted<T>(key: string): Promise<CacheEntry<T> | null> {
    await this.loadPersistIndex();
    if (!this.persistIndex.has(key)) return null;
    try {
      const raw = await AsyncStorage.getItem(PERSIST_PREFIX + key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CacheEntry<T>;
      if (parsed.v !== CACHE_VERSION) {
        await this.removePersisted(key);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private async setPersisted<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    await this.loadPersistIndex();
    await AsyncStorage.setItem(PERSIST_PREFIX + key, JSON.stringify(entry));
    this.persistIndex.add(key);
    await this.savePersistIndex();
  }

  private async removePersisted(key: string): Promise<void> {
    await this.loadPersistIndex();
    this.persistIndex.delete(key);
    await AsyncStorage.removeItem(PERSIST_PREFIX + key);
    await this.savePersistIndex();
  }

  private async clearExpiredPersisted(): Promise<void> {
    await this.loadPersistIndex();
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    for (const key of [...this.persistIndex]) {
      try {
        const raw = await AsyncStorage.getItem(PERSIST_PREFIX + key);
        if (!raw) {
          this.persistIndex.delete(key);
          continue;
        }
        const parsed = JSON.parse(raw) as CacheEntry<unknown>;
        if (parsed.v !== CACHE_VERSION || now - parsed.fetchedAt > maxAge) {
          await this.removePersisted(key);
        }
      } catch {
        await this.removePersisted(key);
      }
    }
  }
}

export const CacheManager = new CacheManagerImpl();

export function buildCacheKey(path: string, params?: Record<string, unknown>): string {
  const sorted = params
    ? Object.keys(params)
        .sort()
        .map((k) => `${k}=${String(params[k] ?? '')}`)
        .join('&')
    : '';
  return `api:${path}${sorted ? `?${sorted}` : ''}`;
}
