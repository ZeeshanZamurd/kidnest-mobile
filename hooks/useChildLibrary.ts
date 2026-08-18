import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchChildFeed, fetchChildLibrary } from '../api/assignments';
import { CacheManager } from '../services/cache';
import { FEED_API_TTL_MS } from '../services/cache/types';
import { useAppStore } from '../store/useAppStore';
import type { Video } from '../types';
import { mapAssignedChannelToChildChannel, type ChildChannel } from '../utils/channelMapper';
import { mapAssignedVideoToVideo } from '../utils/videoMapper';
import { rankSuggestedVideos, getAdjacentVideos, buildPlaylist } from '../utils/videoSuggestions';

const LIBRARY_POLICY = {
  ttlMs: FEED_API_TTL_MS,
  staleWhileRevalidate: true,
  persist: true,
} as const;

function applyLibraryData(
  library: Awaited<ReturnType<typeof fetchChildLibrary>>,
  feed: Awaited<ReturnType<typeof fetchChildFeed>>,
  favoriteSet: Set<string>,
) {
  const mappedChannels = library.channels.map(mapAssignedChannelToChildChannel);
  const directVideos = library.videos.map(mapAssignedVideoToVideo);
  const seen = new Set<string>();
  const mergedFeed: Video[] = [];
  const feedItems = Array.isArray(feed) ? feed : [];
  for (const item of feedItems) {
    const video = {
      ...mapAssignedVideoToVideo(item),
      isFavorite: favoriteSet.has(item.video.id),
    };
    if (seen.has(video.id)) continue;
    seen.add(video.id);
    mergedFeed.push(video);
  }
  return {
    channels: mappedChannels,
    assignedChannelIds: new Set(mappedChannels.map((c) => c.id)),
    directVideos,
    feedVideos: mergedFeed,
  };
}

export function useChildLibrary(childId: string | null) {
  const favoriteVideoIds = useAppStore((s) => s.childFavoriteVideoIds);
  const favoriteChannelIds = useAppStore((s) => s.childFavoriteChannelIds);
  const [channels, setChannels] = useState<ChildChannel[]>([]);
  const [directVideos, setDirectVideos] = useState<Video[]>([]);
  const [feedVideos, setFeedVideos] = useState<Video[]>([]);
  const [assignedChannelIds, setAssignedChannelIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(Boolean(childId));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrateFromCache = useCallback(async (id: string): Promise<boolean> => {
    const [libEntry, feedEntry] = await Promise.all([
      CacheManager.get<Awaited<ReturnType<typeof fetchChildLibrary>>>(`library:${id}`, LIBRARY_POLICY),
      CacheManager.get<Awaited<ReturnType<typeof fetchChildFeed>>>(`feed:${id}`, LIBRARY_POLICY),
    ]);
    if (!libEntry || !feedEntry) return false;
    const favoriteSet = new Set(useAppStore.getState().childFavoriteVideoIds);
    const next = applyLibraryData(libEntry.data, feedEntry.data, favoriteSet);
    setChannels(next.channels);
    setAssignedChannelIds(next.assignedChannelIds);
    setDirectVideos(next.directVideos);
    setFeedVideos(next.feedVideos);
    setLoading(false);
    return true;
  }, []);

  const reload = useCallback(
    async (silent = false) => {
      if (!childId) {
        setChannels([]);
        setDirectVideos([]);
        setFeedVideos([]);
        setAssignedChannelIds(new Set());
        setLoading(false);
        return;
      }

      if (!silent) {
        const hadCache = await hydrateFromCache(childId);
        if (!hadCache) setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      try {
        const [library, feed] = await Promise.all([
          fetchChildLibrary(childId),
          fetchChildFeed(childId),
        ]);

        const favoriteSet = new Set(useAppStore.getState().childFavoriteVideoIds);
        const next = applyLibraryData(library, feed, favoriteSet);
        setChannels(next.channels);
        setAssignedChannelIds(next.assignedChannelIds);
        setDirectVideos(next.directVideos);
        setFeedVideos(next.feedVideos);
      } catch {
        if (!silent) {
          const hadCache = await hydrateFromCache(childId);
          if (!hadCache) {
            setChannels([]);
            setDirectVideos([]);
            setFeedVideos([]);
            setAssignedChannelIds(new Set());
            setError('child_load_error');
          }
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [childId, hydrateFromCache],
  );

  useEffect(() => {
    if (!childId) return;
    const favoriteSet = new Set(favoriteVideoIds);
    setFeedVideos((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((video) => ({ ...video, isFavorite: favoriteSet.has(video.id) }));
    });
  }, [childId, favoriteVideoIds]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const videos = feedVideos;

  const shortVideos = useMemo(
    () => feedVideos.filter((v) => v.contentType === 'SHORT'),
    [feedVideos],
  );

  const getRelatedVideos = useCallback(
    (videoId: string, category: Video['category'], limit = 12, contentType?: Video['contentType']) => {
      const sameType = feedVideos.filter((v) =>
        contentType ? v.contentType === contentType : true,
      );
      const source = sameType.length > 1 ? sameType : feedVideos;
      return rankSuggestedVideos(source, videoId, category, limit);
    },
    [feedVideos],
  );

  const getNextVideo = useCallback(
    (videoId: string, category: Video['category'], contentType?: Video['contentType']) => {
      const playlist = buildPlaylist(feedVideos, category, contentType);
      return getAdjacentVideos(playlist, videoId).next;
    },
    [feedVideos],
  );

  const getPrevVideo = useCallback(
    (videoId: string, category: Video['category'], contentType?: Video['contentType']) => {
      const playlist = buildPlaylist(feedVideos, category, contentType);
      return getAdjacentVideos(playlist, videoId).prev;
    },
    [feedVideos],
  );

  const isChannelAssigned = useCallback(
    (channelId: string) => assignedChannelIds.has(channelId),
    [assignedChannelIds],
  );

  const isChannelFavorite = useCallback(
    (channelId: string) => favoriteChannelIds.includes(channelId),
    [favoriteChannelIds],
  );

  const hasContent = useMemo(
    () => channels.length > 0 || directVideos.length > 0 || feedVideos.length > 0,
    [channels.length, directVideos.length, feedVideos.length],
  );

  return {
    channels,
    directVideos,
    feedVideos,
    shortVideos,
    videos,
    assignedChannelIds,
    isChannelAssigned,
    isChannelFavorite,
    getRelatedVideos,
    getNextVideo,
    getPrevVideo,
    hasContent,
    loading,
    refreshing,
    error,
    reload,
  };
}
