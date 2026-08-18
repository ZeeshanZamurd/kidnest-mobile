import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import {
  fetchChildChannelFavorites,
  fetchChildFavorites,
  toggleChildChannelFavorite,
  toggleChildVideoFavorite,
  type FavoriteChannelRecord,
  type FavoriteVideoRecord,
} from '../api/favorites';
import { useAppStore } from '../store/useAppStore';
import type { ChildChannel } from '../utils/channelMapper';

export function useChildFavorites(childId: string | null) {
  const [videoFavorites, setVideoFavorites] = useState<FavoriteVideoRecord[]>([]);
  const [channelFavorites, setChannelFavorites] = useState<FavoriteChannelRecord[]>([]);
  const [loading, setLoading] = useState(Boolean(childId));
  const syncStore = useAppStore((s) => s.setChildFavoriteIds);

  const reload = useCallback(async () => {
    if (!childId) {
      setVideoFavorites([]);
      setChannelFavorites([]);
      syncStore([], []);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [videos, channels] = await Promise.all([
        fetchChildFavorites(childId),
        fetchChildChannelFavorites(childId),
      ]);
      setVideoFavorites(videos);
      setChannelFavorites(channels);
      syncStore(
        videos.map((v) => v.video.id),
        channels.map((c) => c.channel.id),
      );
    } catch {
      setVideoFavorites([]);
      setChannelFavorites([]);
      syncStore([], []);
    } finally {
      setLoading(false);
    }
  }, [childId, syncStore]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useFocusEffect(
    React.useCallback(() => {
      void reload();
    }, [reload]),
  );

  const favoriteVideoIds = useMemo(
    () => new Set(videoFavorites.map((f) => f.video.id)),
    [videoFavorites],
  );

  const favoriteChannelIds = useMemo(
    () => new Set(channelFavorites.map((f) => f.channel.id)),
    [channelFavorites],
  );

  const isVideoFavorite = useCallback(
    (videoId: string) => favoriteVideoIds.has(videoId),
    [favoriteVideoIds],
  );

  const isChannelFavorite = useCallback(
    (channelId: string) => favoriteChannelIds.has(channelId),
    [favoriteChannelIds],
  );

  const toggleVideo = useCallback(
    async (videoId: string) => {
      if (!childId) return;
      const wasFavorite = favoriteVideoIds.has(videoId);
      setVideoFavorites((prev) =>
        wasFavorite
          ? prev.filter((f) => f.video.id !== videoId)
          : [
              ...prev,
              {
                id: `local-${videoId}`,
                video: {
                  id: videoId,
                  title: '',
                  thumbnailUrl: null,
                  channelName: '',
                },
              },
            ],
      );
      syncStore(
        wasFavorite
          ? [...favoriteVideoIds].filter((id) => id !== videoId)
          : [...favoriteVideoIds, videoId],
        [...favoriteChannelIds],
      );
      try {
        const result = await toggleChildVideoFavorite(childId, videoId);
        if (result.favorited !== !wasFavorite) {
          void reload();
        }
      } catch {
        void reload();
      }
    },
    [childId, favoriteChannelIds, favoriteVideoIds, reload, syncStore],
  );

  const toggleChannel = useCallback(
    async (channelId: string) => {
      if (!childId) return;
      const wasFavorite = favoriteChannelIds.has(channelId);
      setChannelFavorites((prev) =>
        wasFavorite
          ? prev.filter((f) => f.channel.id !== channelId)
          : [
              ...prev,
              {
                id: `local-${channelId}`,
                channel: {
                  id: channelId,
                  title: '',
                  thumbnailUrl: null,
                  description: null,
                },
              },
            ],
      );
      syncStore(
        [...favoriteVideoIds],
        wasFavorite
          ? [...favoriteChannelIds].filter((id) => id !== channelId)
          : [...favoriteChannelIds, channelId],
      );
      try {
        const result = await toggleChildChannelFavorite(childId, channelId);
        if (result.favorited !== !wasFavorite) {
          void reload();
        }
      } catch {
        void reload();
      }
    },
    [childId, favoriteChannelIds, favoriteVideoIds, reload, syncStore],
  );

  const favoriteChannels = useMemo<ChildChannel[]>(
    () =>
      channelFavorites.map((f) => ({
        id: f.channel.id,
        name: f.channel.title,
        thumbnail: f.channel.thumbnailUrl ?? '',
        description: f.channel.description,
        categoryId: null,
        categoryName: null,
      })),
    [channelFavorites],
  );

  return {
    videoFavorites,
    channelFavorites,
    favoriteChannels,
    favoriteVideoIds,
    favoriteChannelIds,
    isVideoFavorite,
    isChannelFavorite,
    toggleVideo,
    toggleChannel,
    loading,
    reload,
  };
}
