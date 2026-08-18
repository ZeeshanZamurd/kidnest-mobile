import { Image } from 'react-native';
import { CacheManager } from './CacheManager';

const inflightImages = new Map<string, Promise<boolean>>();

/** Prefetch remote images into RN disk/memory cache — deduped. */
export function prefetchImage(uri: string | null | undefined): Promise<boolean> {
  if (!uri?.trim()) return Promise.resolve(false);

  const normalized = uri.trim();
  if (CacheManager.markImagePrefetched(normalized)) {
    return Promise.resolve(true);
  }

  const existing = inflightImages.get(normalized);
  if (existing) return existing;

  const task = Image.prefetch(normalized)
    .then(() => {
      CacheManager.markImagePrefetched(normalized);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      inflightImages.delete(normalized);
    });

  inflightImages.set(normalized, task);
  return task;
}

export function prefetchImages(uris: Array<string | null | undefined>, limit = 12): void {
  const unique = [...new Set(uris.filter(Boolean) as string[])].slice(0, limit);
  for (const uri of unique) {
    void prefetchImage(uri);
  }
}

export function prefetchImageBatch(
  uris: Array<string | null | undefined>,
  startIndex: number,
  count: number,
): void {
  prefetchImages(uris.slice(startIndex, startIndex + count));
}
