import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import GradientBackground from '../../components/ui/GradientBackground';
import ChildChannelCard from '../../components/discover/ChildChannelCard';
import ProfileAvatar from '../../components/profile/ProfileAvatar';
import ChildColorSection from '../../components/child/ChildColorSection';
import {
  CATEGORY_THEMES,
  FAVORITES_THEME,
} from '../../components/child/categoryThemes';
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
import { spacing } from '../../theme/colors';
import type { RootStackParamList, ChildTabParamList } from '../../navigation/types';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { Video } from '../../types';
import type { WatchHistoryItem } from '../../api/watch';
import type { AvatarKey } from '../../constants/avatars';
import { getChildProfileMeta } from '../../services/childProfileMetaStorage';
import { getHomeSuggestedVideos, buildMixedForYouFeed } from '../../utils/videoSuggestions';
import { LIST_PERFORMANCE } from '../../services/cache/flatListConfig';
import { prefetchFeedThumbnails, prefetchChannelThumbnails } from '../../services/cache/prefetch';
import { childTapHaptic } from '../../utils/childHaptics';

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
  const { colors, isDark, toggleTheme } = useTheme();
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
    () => buildMixedForYouFeed(feedVideos.filter((v) => v.contentType !== 'SHORT')),
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

  const FEED_PAGE = 12;
  const [feedVisibleCount, setFeedVisibleCount] = useState(FEED_PAGE);

  useEffect(() => {
    setFeedVisibleCount(FEED_PAGE);
  }, [feedWithProgress.length]);

  const visibleFeed = useMemo(
    () => feedWithProgress.slice(0, feedVisibleCount),
    [feedVisibleCount, feedWithProgress],
  );

  const revealMoreFeed = useCallback(() => {
    if (feedVisibleCount >= feedWithProgress.length) return;
    setFeedVisibleCount((n) => Math.min(n + FEED_PAGE, feedWithProgress.length));
  }, [feedVisibleCount, feedWithProgress.length]);

  const onHomeScroll = useCallback(
    (e: { nativeEvent: { layoutMeasurement: { height: number }; contentOffset: { y: number }; contentSize: { height: number } } }) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 480) {
        revealMoreFeed();
      }
    },
    [revealMoreFeed],
  );

  const openVideo = useCallback(
    (videoId: string) => {
      const meta =
        feedVideos.find((v) => v.id === videoId) ??
        continueWithProgress.find((v) => v.id === videoId) ??
        suggestedWithProgress.find((v) => v.id === videoId) ??
        feedWithProgress.find((v) => v.id === videoId);
      if (meta?.contentType === 'SHORT') {
        navigation.navigate('ChildFeed', {
          videoId,
          channelId: meta.channelId,
        });
        return;
      }
      navigation.navigate('VideoPlayer', {
        videoId,
        title: meta?.title,
        thumbnailUrl: meta?.thumbnail,
      });
    },
    [
      continueWithProgress,
      feedVideos,
      feedWithProgress,
      navigation,
      suggestedWithProgress,
    ],
  );

  const switchProfile = () => {
    childTapHaptic('select');
    exitProfileMode();
    navigation.reset({ index: 0, routes: [{ name: 'ProfileSelection' }] });
  };

  const toggleDarkMode = () => {
    childTapHaptic('tap');
    toggleTheme();
  };

  const openChannel = (channelId: string) => {
    navigation.navigate('ChildChannelDetail', { channelId });
  };

  return (
    <GradientBackground variant="child">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        scrollEventThrottle={16}
        onScroll={onHomeScroll}
      >
        <Animated.View entering={FadeInDown.duration(280)} style={[styles.header, { paddingTop: headerTop }]}>
          <View style={[styles.hero, { backgroundColor: colors.surface }]}>
            <View style={styles.heroLeft}>
              <ProfileAvatar avatarKey={avatarKey} size={48} />
              <View style={styles.heroText}>
                <Text style={[styles.hi, { color: colors.text }]}>
                  {t('child_hi_name', { name: childName, defaultValue: `Hi, ${childName}!` })}
                </Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>{t('learning_fun')}</Text>
              </View>
            </View>
            <View style={styles.heroActions}>
              <Pressable
                onPress={toggleDarkMode}
                style={[styles.switchBtn, { backgroundColor: colors.background }]}
                accessibilityRole="button"
                accessibilityLabel={
                  isDark
                    ? t('light_mode', { defaultValue: 'Light mode' })
                    : t('dark_mode', { defaultValue: 'Dark mode' })
                }
              >
                <Icon name={isDark ? 'sunny' : 'moon'} size={20} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={switchProfile}
                style={[styles.switchBtn, { backgroundColor: colors.background }]}
                accessibilityRole="button"
                accessibilityLabel={t('switch_profile', { defaultValue: 'Switch profile' })}
              >
                <Icon name="swap-horizontal" size={20} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {loading ? (
          <ChildHomeSkeleton />
        ) : error && !hasContent ? (
          <ChildLoadError
            title={t('child_load_error')}
            description={t('child_load_error_desc')}
            retryLabel={t('try_again')}
            onRetry={() => {
              childTapHaptic('tap');
              void reloadLibrary();
            }}
          />
        ) : !hasContent ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📺</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('no_assigned_videos')}</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              {t('no_assigned_videos_desc')}
            </Text>
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(280)}>
            <ChildColorSection
              title={t('continue_watching')}
              theme={FAVORITES_THEME}
              videos={continueWithProgress}
              horizontal
              onPressVideo={openVideo}
              onFavorite={(id) => void toggleVideo(id)}
            />

            <ChildColorSection
              title={t('suggested_for_you')}
              theme={CATEGORY_THEMES.science}
              videos={suggestedWithProgress}
              horizontal
              onPressVideo={openVideo}
              onFavorite={(id) => void toggleVideo(id)}
            />

            {channels.length > 0 ? (
              <View style={styles.channelSection}>
                <View style={styles.channelHeader}>
                  <Text style={styles.channelHeaderEmoji}>🎬</Text>
                  <Text style={[styles.channelHeaderTitle, { color: colors.text }]}>
                    {t('my_channels')}
                  </Text>
                </View>
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
                  contentContainerStyle={styles.channelList}
                  {...LIST_PERFORMANCE}
                  initialNumToRender={6}
                />
              </View>
            ) : null}

            <ChildColorSection
              title={t('for_you')}
              theme={CATEGORY_THEMES.art}
              videos={visibleFeed}
              onPressVideo={openVideo}
              onFavorite={(id) => void toggleVideo(id)}
            />
          </Animated.View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: 4,
  },
  header: {
    paddingHorizontal: spacing.md,
    marginBottom: 12,
  },
  hero: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  hi: {
    fontSize: 20,
    fontWeight: '800',
  },
  sub: {
    fontSize: 13,
    fontWeight: '600',
  },
  switchBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelSection: {
    marginBottom: 20,
  },
  channelHeader: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelHeaderEmoji: {
    fontSize: 18,
  },
  channelHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  channelList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    alignItems: 'flex-start',
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
});
