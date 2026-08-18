import type { ContentCategory, Video } from '../types';

/** Rank assigned feed videos: same interest/category first, then the rest. */
export function rankSuggestedVideos(
  feedVideos: Video[],
  currentVideoId: string,
  category: ContentCategory,
  limit = 12,
): Video[] {
  const pool = feedVideos.filter((v) => v.id !== currentVideoId);
  const sameCategory = pool.filter((v) => v.category === category);
  const other = pool.filter((v) => v.category !== category);
  return [...sameCategory, ...other].slice(0, limit);
}

export function getNextVideo(
  feedVideos: Video[],
  currentVideoId: string,
  category: ContentCategory,
): Video | null {
  return getAdjacentVideos(buildPlaylist(feedVideos, category), currentVideoId).next;
}

/** Ordered playlist for prev/next navigation (same category first). */
export function buildPlaylist(
  feedVideos: Video[],
  category: ContentCategory,
  contentType?: Video['contentType'],
): Video[] {
  const sameType = feedVideos.filter((v) =>
    contentType ? v.contentType === contentType : true,
  );
  const source = sameType.length > 0 ? sameType : feedVideos;
  const sameCategory = source.filter((v) => v.category === category);
  const other = source.filter((v) => v.category !== category);
  return [...sameCategory, ...other];
}

export function getAdjacentVideos(
  playlist: Video[],
  currentVideoId: string,
): { prev: Video | null; next: Video | null } {
  const idx = playlist.findIndex((v) => v.id === currentVideoId);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? playlist[idx - 1]! : null,
    next: idx < playlist.length - 1 ? playlist[idx + 1]! : null,
  };
}

export function getHomeSuggestedVideos(
  feedVideos: Video[],
  excludeIds: string[] = [],
  limit = 10,
): Video[] {
  const exclude = new Set(excludeIds);
  const pool = feedVideos.filter((v) => !exclude.has(v.id));
  const byCategory = new Map<string, Video[]>();
  for (const v of pool) {
    const list = byCategory.get(v.category) ?? [];
    list.push(v);
    byCategory.set(v.category, list);
  }
  const categories = [...byCategory.keys()];
  if (categories.length === 0) return [];

  const result: Video[] = [];
  let round = 0;
  while (result.length < limit && round < pool.length) {
    for (const cat of categories) {
      const list = byCategory.get(cat)!;
      if (round < list.length) {
        result.push(list[round]!);
        if (result.length >= limit) break;
      }
    }
    round++;
  }
  return result;
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/** Shorts feed: channel shorts first (shuffled), then the rest (shuffled). */
export function buildShortsPlaylist(
  shorts: Video[],
  options?: { startVideoId?: string; channelId?: string },
): Video[] {
  if (shorts.length === 0) return [];

  const { startVideoId, channelId } = options ?? {};

  if (channelId) {
    const channelShorts = shorts.filter((v) => v.channelId === channelId);
    const otherShorts = shuffleArray(shorts.filter((v) => v.channelId !== channelId));

    if (startVideoId) {
      const start = shorts.find((v) => v.id === startVideoId);
      if (start) {
        const restChannel = shuffleArray(channelShorts.filter((v) => v.id !== startVideoId));
        return [start, ...restChannel, ...otherShorts];
      }
    }

    return [...shuffleArray(channelShorts), ...otherShorts];
  }

  const shuffled = shuffleArray(shorts);
  if (!startVideoId) return shuffled;

  const idx = shuffled.findIndex((v) => v.id === startVideoId);
  if (idx <= 0) return shuffled;

  const next = [...shuffled];
  const [start] = next.splice(idx, 1);
  return [start!, ...next];
}
