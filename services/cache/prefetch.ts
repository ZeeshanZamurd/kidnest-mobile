import type { BrowseVideo } from '../../api/browse';
import { prefetchImageBatch, prefetchImages } from './imageCache';
import { prefetchVideoStreams } from './videoCache';

export function prefetchBrowseThumbnails(items: BrowseVideo[], fromIndex = 0, count = 8): void {
  prefetchImageBatch(
    items.map((v) => v.thumbnailUrl),
    fromIndex,
    count,
  );
}

export function prefetchFeedThumbnails(
  items: Array<{ thumbnail?: string; thumbnailUrl?: string | null }>,
  activeIndex: number,
  window = 3,
): void {
  const uris = items.map((v) => v.thumbnail ?? v.thumbnailUrl ?? null);
  prefetchImageBatch(uris, Math.max(0, activeIndex - 1), window + 2);
  prefetchImageBatch(uris, activeIndex + 1, window);
}

export function prefetchVideoMetadata(items: Array<{ streamUrl?: string | null }>, fromIndex: number): void {
  prefetchVideoStreams(
    items.slice(fromIndex, fromIndex + 4).map((v) => v.streamUrl),
    3,
  );
}

export function prefetchChannelThumbnails(
  channels: Array<{ thumbnailUrl?: string | null; thumbnail?: string | null }>,
): void {
  prefetchImages(channels.map((c) => c.thumbnailUrl ?? c.thumbnail ?? null), 20);
}
