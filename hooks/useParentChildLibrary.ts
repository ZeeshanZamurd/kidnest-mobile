import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  fetchChildLibrary,
  removeChannel,
  removeVideo,
  type AssignedChannel,
  type AssignedVideo,
} from '../api/assignments';

export type ChildLibraryFilter = 'all' | 'channels' | 'videos' | 'shorts';

export function useParentChildLibrary(childId: string | null) {
  const [videos, setVideos] = useState<AssignedVideo[]>([]);
  const [channels, setChannels] = useState<AssignedChannel[]>([]);
  const [loading, setLoading] = useState(Boolean(childId));
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async (silent = false) => {
    if (!childId) {
      setVideos([]);
      setChannels([]);
      setLoading(false);
      return;
    }

    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const lib = await fetchChildLibrary(childId);
      setVideos(lib.videos);
      setChannels(lib.channels);
    } catch {
      setVideos([]);
      setChannels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [childId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      void reload(true);
    }, [reload]),
  );

  const shortVideos = useMemo(
    () => videos.filter((v) => v.video.contentType === 'SHORT'),
    [videos],
  );

  const longVideos = useMemo(
    () => videos.filter((v) => v.video.contentType !== 'SHORT'),
    [videos],
  );

  const stats = useMemo(
    () => ({
      channels: channels.length,
      videos: longVideos.length,
      shorts: shortVideos.length,
      total: channels.length + videos.length,
    }),
    [channels.length, longVideos.length, shortVideos.length, videos.length],
  );

  const removeVideoItem = useCallback(
    async (videoId: string) => {
      if (!childId) return false;
      await removeVideo(childId, videoId);
      await reload(true);
      return true;
    },
    [childId, reload],
  );

  const removeChannelItem = useCallback(
    async (channelId: string) => {
      if (!childId) return false;
      await removeChannel(childId, channelId);
      await reload(true);
      return true;
    },
    [childId, reload],
  );

  return {
    videos,
    channels,
    shortVideos,
    longVideos,
    stats,
    loading,
    refreshing,
    reload,
    removeVideoItem,
    removeChannelItem,
  };
}
