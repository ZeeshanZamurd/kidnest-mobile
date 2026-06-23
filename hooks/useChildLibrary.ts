import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchChildFeed, fetchChildLibrary } from '../api/assignments';
import type { Video } from '../types';
import { mapAssignedChannelToChildChannel, type ChildChannel } from '../utils/channelMapper';
import { mapAssignedVideoToVideo } from '../utils/videoMapper';

export function useChildLibrary(childId: string | null) {
  const [channels, setChannels] = useState<ChildChannel[]>([]);
  const [directVideos, setDirectVideos] = useState<Video[]>([]);
  const [feedVideos, setFeedVideos] = useState<Video[]>([]);
  const [assignedChannelIds, setAssignedChannelIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(Boolean(childId));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!childId) {
      setChannels([]);
      setDirectVideos([]);
      setFeedVideos([]);
      setAssignedChannelIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [library, feed] = await Promise.all([
        fetchChildLibrary(childId),
        fetchChildFeed(childId),
      ]);

      const mappedChannels = library.channels.map(mapAssignedChannelToChildChannel);
      setChannels(mappedChannels);
      setAssignedChannelIds(new Set(mappedChannels.map((c) => c.id)));
      setDirectVideos(library.videos.map(mapAssignedVideoToVideo));

      const seen = new Set<string>();
      const mergedFeed: Video[] = [];
      const feedItems = Array.isArray(feed) ? feed : [];
      for (const item of feedItems) {
        const video = mapAssignedVideoToVideo(item);
        if (seen.has(video.id)) continue;
        seen.add(video.id);
        mergedFeed.push(video);
      }
      setFeedVideos(mergedFeed);
    } catch {
      setChannels([]);
      setDirectVideos([]);
      setFeedVideos([]);
      setAssignedChannelIds(new Set());
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const videos = feedVideos;

  const shortVideos = useMemo(
    () => feedVideos.filter((v) => v.contentType === 'SHORT'),
    [feedVideos],
  );

  const getRelatedVideos = useCallback(
    (videoId: string, category: Video['category'], limit = 12) =>
      feedVideos.filter((v) => v.id !== videoId && v.category === category).slice(0, limit),
    [feedVideos],
  );

  const isChannelAssigned = useCallback(
    (channelId: string) => assignedChannelIds.has(channelId),
    [assignedChannelIds],
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
    getRelatedVideos,
    hasContent,
    loading,
    error,
    reload,
  };
}
