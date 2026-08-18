import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';
import GradientBackground from '../../components/ui/GradientBackground';
import SectionHeader from '../../components/ui/SectionHeader';
import VideoCard from '../../components/video/VideoCard';
import ChildChannelCard from '../../components/discover/ChildChannelCard';
import ProfileAvatar from '../../components/profile/ProfileAvatar';
import { ChildHomeSkeleton } from '../../components/child/ChildScreenSkeletons';
import { ChildLoadError } from '../../components/child/ChildLoadFeedback';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { useChildLibrary } from '../../hooks/useChildLibrary';
import { useChildFavorites } from '../../hooks/useChildFavorites';
import { useChildWatchHistory } from '../../hooks/useChildWatchHistory';
import { useVideosWithProgress } from '../../hooks/useVideosWithProgress';
import { useTabScreenPadding } from '../../hooks/useScreenPadding';
import { useAppInsets } from '../../hooks/useAppInsets';
import { formatDuration } from '../../api/browse';
import { normalizeCategory } from '../../utils/videoMapper';
import { spacing, typography } from '../../theme/colors';
import type { RootStackParamList, ChildTabParamList } from '../../navigation/types';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { Video } from '../../types';
import type { WatchHistoryItem } from '../../api/watch';
import type { AvatarKey } from '../../constants/avatars';
import { getChildProfileMeta } from '../../services/childProfileMetaStorage';
import { getHomeSuggestedVideos } from '../../utils/videoSuggestions';
import { LIST_PERFORMANCE } from '../../services/cache/flatListConfig';
import { prefetchFeedThumbnails, prefetchChannelThumbnails } from '../../services/cache/prefetch';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<ChildTabParamList, 'ChildHome'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function watchItemToVideo(item: WatchHistoryItem): Video {
  return {
    id: item.videoId,
    title: item.video.title,
    thumbnail: item.video.thumbnailUrl ?? '',
    duration: formatDuration(item.video.durationSecs),
    durationSeconds: item.video.durationSecs,
    channelId: '',
    channelName: item.video.channelName,
    category: normalizeCategory(item.video.category),
    status: 'approved',
    views: '0',
    publishedAt: item.watchedAt,
    isFavorite: false,
    watchProgress: item.progressPercent / 100,
  };
}

export default function ChildHomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const activeChildId = useAppStore((s) => s.activeChildId);
  const apiChildren = useAppStore((s) => s.apiChildren);
  const exitProfileMode = useAppStore((s) => s.exitProfileMode);
  const { channels, feedVideos, hasContent, loading, error, isChannelFavorite, reload: reloadLibrary } =
    useChildLibrary(activeChildId);
  const { toggleVideo, toggleChannel } = useChildFavorites(activeChildId);
  const { continueWatching, reload: reloadWatch } = useChildWatchHistory(activeChildId);
  const { headerTop } = useAppInsets();
  const scrollBottomPad = useTabScreenPadding();

  const [avatarKey, setAvatarKey] = useState<AvatarKey>('lion');
  const [inlinePlayingId, setInlinePlayingId] = useState<string | null>(null);
  const lastScrollY = useRef(0);

  const stopInlinePlay = useCallback(() => {
    setInlinePlayingId(null);
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!inlinePlayingId) return;
      const y = e.nativeEvent.contentOffset.y;
      if (Math.abs(y - lastScrollY.current) > 10) {
        stopInlinePlay();
      }
      lastScrollY.current = y;
    },
    [inlinePlayingId, stopInlinePlay],
  );

  const childName = useMemo(() => {
    const apiChild = apiChildren.find((c) => c.id === activeChildId);
    return apiChild?.user.displayName ?? t('home');
  }, [activeChildId, apiChildren, t]);

  useEffect(() => {
    if (!activeChildId) return;
    void getChildProfileMeta(activeChildId, 0).then((meta) => setAvatarKey(meta.avatarKey));
  }, [activeChildId]);

  useFocusEffect(
    React.useCallback(() => {
      void reloadWatch();
      void reloadLibrary(true);
      return () => setInlinePlayingId(null);
    }, [reloadWatch, reloadLibrary]),
  );

  useEffect(() => {
    if (feedVideos.length === 0) return;
    prefetchFeedThumbnails(feedVideos, 0, 12);
    prefetchChannelThumbnails(channels);
  }, [feedVideos, channels]);

  const continueVideos = useMemo(
    () =>
      continueWatching
        .map(watchItemToVideo)
        .filter((v) => {
          const feedItem = feedVideos.find((f) => f.id === v.id);
          return feedItem?.contentType !== 'SHORT';
        }),
    [continueWatching, feedVideos],
  );

  const longFormFeed = useMemo(
    () => feedVideos.filter((v) => v.contentType !== 'SHORT'),
    [feedVideos],
  );

  const suggestedVideos = useMemo(
    () =>
      getHomeSuggestedVideos(
        longFormFeed,
        continueVideos.map((v) => v.id),
        10,
      ),
    [longFormFeed, continueVideos],
  );

  const continueWithProgress = useVideosWithProgress(activeChildId, continueVideos);
  const suggestedWithProgress = useVideosWithProgress(activeChildId, suggestedVideos);
  const feedWithProgress = useVideosWithProgress(activeChildId, longFormFeed);

  const openVideo = (videoId: string) => {
    const meta = feedVideos.find((v) => v.id === videoId);
    if (meta?.contentType === 'SHORT') {
      navigation.navigate('ChildFeed', { videoId, channelId: meta.channelId });
      return;
    }
    navigation.navigate('VideoPlayer', { videoId });
  };

  const cardProps = (video: Video) => ({
    video,
    inlinePlay: true,
    isPlayingInline: inlinePlayingId === video.id,
    onStartInline: () => setInlinePlayingId(video.id),
    onStopInline: () => setInlinePlayingId((id) => (id === video.id ? null : id)),
    onPress: () => {
      setInlinePlayingId(null);
      openVideo(video.id);
    },
    onFavorite: () => void toggleVideo(video.id),
  });

  const switchProfile = () => {
    exitProfileMode();
    navigation.reset({ index: 0, routes: [{ name: 'ProfileSelection' }] });
  };

  const openChannel = (channelId: string) => {
    navigation.navigate('ChildChannelDetail', { channelId });
  };

  return (
    <GradientBackground variant="child">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        onScrollBeginDrag={stopInlinePlay}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.header, { paddingTop: headerTop }]}>
          <View style={styles.headerLeft}>
            <ProfileAvatar avatarKey={avatarKey} size={48} />
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {t('learning_fun')}
              </Text>
              <Text style={[styles.name, { color: colors.text }]}>{childName}</Text>
            </View>
          </View>
          <Pressable onPress={switchProfile} style={[styles.switchBtn, { backgroundColor: colors.surface }]}>
            <Icon name="swap-horizontal" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {loading ? (
          <ChildHomeSkeleton />
        ) : error && !hasContent ? (
          <ChildLoadError
            title={t('child_load_error')}
            description={t('child_load_error_desc')}
            retryLabel={t('try_again')}
            onRetry={() => void reloadLibrary()}
          />
        ) : !hasContent ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('no_assigned_videos')}</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>{t('no_assigned_videos_desc')}</Text>
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(280)}>
            {continueWithProgress.length > 0 && (
              <>
                <SectionHeader title={t('continue_watching')} />
                <FlatList
                  horizontal
                  data={continueWithProgress}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <VideoCard {...cardProps(item)} horizontal />
                  )}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: spacing.md }}
                  {...LIST_PERFORMANCE}
                  initialNumToRender={4}
                />
              </>
            )}

            {suggestedWithProgress.length > 0 && (
              <>
                <SectionHeader title={t('suggested_for_you')} />
                <FlatList
                  horizontal
                  data={suggestedWithProgress}
                  keyExtractor={(item) => `suggested-${item.id}`}
                  renderItem={({ item }) => (
                    <VideoCard {...cardProps(item)} horizontal />
                  )}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}
                  {...LIST_PERFORMANCE}
                  initialNumToRender={4}
                />
              </>
            )}

            {channels.length > 0 && (
              <>
                <SectionHeader title={t('my_channels')} />
                <FlatList
                  horizontal
                  data={channels}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <ChildChannelCard
                      channel={item}
                      compact
                      onPress={() => openChannel(item.id)}
                      onFavorite={() => void toggleChannel(item.id)}
                      isFavorite={isChannelFavorite(item.id)}
                    />
                  )}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}
                  {...LIST_PERFORMANCE}
                  initialNumToRender={6}
                />
              </>
            )}

            {feedWithProgress.length > 0 && (
              <>
                <SectionHeader title={t('for_you')} />
                {feedWithProgress.map((video) => (
                  <View key={video.id} style={{ paddingHorizontal: spacing.md }}>
                    <VideoCard {...cardProps(video)} />
                  </View>
                ))}
              </>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  greeting: { ...typography.caption },
  name: { ...typography.h2 },
  switchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.h3, textAlign: 'center' },
  emptyDesc: { ...typography.body, textAlign: 'center' },
});
