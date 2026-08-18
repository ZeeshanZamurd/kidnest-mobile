import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { ChildShortsSkeleton } from '../../components/child/ChildScreenSkeletons';
import { ChildLoadError } from '../../components/child/ChildLoadFeedback';
import Video from 'react-native-video';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useOptionalBottomTabBarHeight } from '../../hooks/useScreenPadding';
import { useAppStore } from '../../store/useAppStore';
import { useChildLibrary } from '../../hooks/useChildLibrary';
import { useChildFavorites } from '../../hooks/useChildFavorites';
import { BRAND_ACCENT, BRAND_CHILD_ACCENT, BRAND_PRIMARY } from '../../constants/branding';
import { spacing, typography } from '../../theme/colors';
import type { RootStackParamList, ChildTabParamList } from '../../navigation/types';
import type { Video as VideoItem } from '../../types';
import { markPlaybackStarted, shouldShowVideoBuffering } from '../../utils/videoBuffering';
import { buildShortsPlaylist } from '../../utils/videoSuggestions';
import { buildCachedVideoSource } from '../../services/cache/videoCache';
import { prefetchFeedThumbnails } from '../../services/cache';
import CachedImage from '../../components/ui/CachedImage';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FeedRoute = RouteProp<ChildTabParamList, 'ChildFeed'>;
type FeedTabNav = BottomTabNavigationProp<ChildTabParamList, 'ChildFeed'>;

function cleanShortTitle(title: string): string {
  const withoutTags = title.replace(/#\S+/g, '').replace(/\s+/g, ' ').trim();
  return withoutTags || title;
}

function FeedItem({
  item,
  isActive,
  screenFocused,
  pageHeight,
  topInset,
  isFavorite,
  onToggleFavorite,
  autoplayEnabled,
  hasNext,
  onAdvance,
}: {
  item: VideoItem;
  isActive: boolean;
  screenFocused: boolean;
  pageHeight: number;
  topInset: number;
  isFavorite: boolean;
  onToggleFavorite: (videoId: string) => void;
  autoplayEnabled: boolean;
  hasNext: boolean;
  onAdvance: () => void;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const heartScale = useSharedValue(1);
  const [showHeart, setShowHeart] = useState(false);
  const [paused, setPaused] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasDisplayedFrame, setHasDisplayedFrame] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const streamUri =
    typeof item.streamUrl === 'string' && item.streamUrl.trim().length > 0
      ? item.streamUrl.trim()
      : null;
  const canPlayInline = Boolean(streamUri);
  const shouldMountVideo = isActive && screenFocused && canPlayInline;
  const isPaused = paused || !screenFocused || !isActive;

  useEffect(() => {
    if (isActive && screenFocused) {
      setPaused(false);
    } else {
      setPaused(true);
      setHasDisplayedFrame(false);
      setIsBuffering(false);
      setCurrentTime(0);
    }
  }, [isActive, screenFocused]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleDoubleTap = () => {
    if (!isFavorite) {
      onToggleFavorite(item.id);
    }
    setShowHeart(true);
    heartScale.value = withSequence(withSpring(1.4), withSpring(1));
    setTimeout(() => setShowHeart(false), 800);
  };

  const lastTapRef = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const DOUBLE_TAP_MS = 320;

  useEffect(() => {
    return () => {
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
    };
  }, []);

  const onTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      lastTapRef.current = 0;
      handleDoubleTap();
      return;
    }

    lastTapRef.current = now;
    if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
    singleTapTimer.current = setTimeout(() => {
      singleTapTimer.current = null;
      if (canPlayInline && screenFocused && isActive) {
        setPaused((p) => !p);
      }
    }, DOUBLE_TAP_MS);
  };

  const showBuffering =
    shouldMountVideo &&
    shouldShowVideoBuffering(hasDisplayedFrame, isBuffering, currentTime);

  const handleVideoEnd = () => {
    if (!isActive || !screenFocused) return;
    if (autoplayEnabled && hasNext) {
      onAdvance();
      return;
    }
    setPaused(true);
  };

  const progress =
    item.durationSeconds > 0 ? Math.min(1, currentTime / item.durationSeconds) : 0;
  const displayTitle = cleanShortTitle(item.title);
  const channelInitial = (item.channelName?.trim().charAt(0) ?? '?').toUpperCase();

  return (
    <View style={[styles.page, { height: pageHeight }]}>
      {shouldMountVideo ? (
        <Video
          key={`${item.id}-${isActive && screenFocused ? 'on' : 'off'}`}
          source={buildCachedVideoSource(streamUri)!}
          style={styles.fullImage}
          resizeMode="cover"
          paused={isPaused}
          repeat={false}
          onEnd={handleVideoEnd}
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="ignore"
          onLoadStart={() => {
            setHasDisplayedFrame(false);
            setIsBuffering(true);
            setCurrentTime(0);
          }}
          onReadyForDisplay={() => {
            setHasDisplayedFrame(true);
            setIsBuffering(false);
          }}
          onBuffer={(e) => {
            if (currentTime <= 0.25) {
              setIsBuffering(e.isBuffering);
            }
          }}
          onProgress={(e) => {
            setCurrentTime(e.currentTime);
            if (markPlaybackStarted(e.currentTime)) {
              setHasDisplayedFrame(true);
              setIsBuffering(false);
            }
          }}
        />
      ) : (
        <CachedImage uri={item.thumbnail} style={styles.fullImage} />
      )}

      <Pressable style={styles.tapLayer} onPress={onTap} accessibilityRole="button" />

      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'transparent']}
        style={[styles.topGradient, { height: topInset + 72 }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {showBuffering && (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}

      {isPaused && isActive && screenFocused && hasDisplayedFrame && !isBuffering ? (
        <View style={styles.playOverlay} pointerEvents="none">
          <View style={styles.playCircle}>
            <Icon name="play" size={36} color="#fff" />
          </View>
        </View>
      ) : null}

      {showHeart ? (
        <Animated.View style={[styles.heartBurst, heartStyle]} pointerEvents="none">
          <Icon name="heart" size={80} color={BRAND_ACCENT} />
        </Animated.View>
      ) : null}

      <View style={[styles.shortBadge, { top: topInset + spacing.sm }]} pointerEvents="none">
        <Icon name="flash" size={13} color="#fff" />
        <Text style={styles.shortBadgeText}>{t('shorts_badge')}</Text>
      </View>

      <View style={styles.sideActions}>
        <Pressable
          style={[styles.actionBtn, isFavorite && styles.actionBtnActive]}
          onPress={() => onToggleFavorite(item.id)}
        >
          <Icon
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={26}
            color={isFavorite ? BRAND_ACCENT : '#fff'}
          />
        </Pressable>
      </View>

      <View style={styles.bottomInfo} pointerEvents="none">
        <View style={styles.channelRow}>
          <View style={styles.channelAvatar}>
            <Text style={styles.channelInitial}>{channelInitial}</Text>
          </View>
          <Text style={styles.feedChannel} numberOfLines={1}>
            {item.channelName}
          </Text>
        </View>
        <Text style={styles.feedTitle} numberOfLines={2}>
          {displayTitle}
        </Text>
        {isActive && screenFocused ? (
          <Text style={styles.hint}>{t('double_tap_like')}</Text>
        ) : null}
      </View>

      {isActive && screenFocused && item.durationSeconds > 0 ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

export default function VideoFeedScreen() {
  const { t } = useTranslation();
  const route = useRoute<FeedRoute>();
  const navigation = useNavigation<FeedTabNav>();
  const isFocused = useIsFocused();
  const { top } = useAppInsets();
  const startVideoId = route.params?.videoId;
  const channelId = route.params?.channelId;
  const [activeIndex, setActiveIndex] = useState(0);
  const activeChildId = useAppStore((s) => s.activeChildId);
  const autoplayEnabled = useAppStore((s) => s.autoplayEnabled);
  const favoriteVideoIds = useAppStore((s) => s.childFavoriteVideoIds);
  const { shortVideos, loading, error, reload } = useChildLibrary(activeChildId);
  const { toggleVideo, isVideoFavorite } = useChildFavorites(activeChildId);
  const tabBarHeight = useOptionalBottomTabBarHeight();
  const flatListRef = useRef<FlashListRef<VideoItem>>(null);

  const feedList = useMemo(
    () => buildShortsPlaylist(shortVideos, { startVideoId, channelId }),
    [shortVideos, startVideoId, channelId],
  );

  useEffect(() => {
    setActiveIndex(0);
    if (startVideoId && feedList.length > 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [startVideoId, channelId, feedList]);

  useEffect(() => {
    const unsub = navigation.addListener('tabPress', () => {
      if (route.params?.videoId || route.params?.channelId) {
        navigation.setParams({ videoId: undefined, channelId: undefined });
      }
    });
    return unsub;
  }, [navigation, route.params?.videoId, route.params?.channelId]);

  const pageHeight = useMemo(
    () => Math.max(SCREEN_HEIGHT - tabBarHeight, SCREEN_HEIGHT * 0.75),
    [tabBarHeight],
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!isFocused) return;
      if (viewableItems[0]?.index != null) {
        const idx = viewableItems[0].index;
        setActiveIndex(idx);
        prefetchFeedThumbnails(feedList, idx, 3);
      }
    },
    [feedList, isFocused],
  );

  const handleAdvance = useCallback(() => {
    if (!isFocused) return;
    const nextIndex = activeIndex + 1;
    if (nextIndex >= feedList.length) return;
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setActiveIndex(nextIndex);
  }, [activeIndex, feedList.length, isFocused]);

  const renderItem = useCallback(
    ({ item, index }: { item: VideoItem; index: number }) => (
      <FeedItem
        item={item}
        isActive={index === activeIndex}
        screenFocused={isFocused}
        pageHeight={pageHeight}
        topInset={top}
        isFavorite={isVideoFavorite(item.id)}
        onToggleFavorite={(videoId) => void toggleVideo(videoId)}
        autoplayEnabled={autoplayEnabled}
        hasNext={index < feedList.length - 1}
        onAdvance={handleAdvance}
      />
    ),
    [
      activeIndex,
      isFocused,
      isVideoFavorite,
      pageHeight,
      top,
      toggleVideo,
      autoplayEnabled,
      feedList.length,
      handleAdvance,
    ],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ChildShortsSkeleton />
      </View>
    );
  }

  if (error && feedList.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ChildLoadError
          title={t('child_load_error')}
          description={t('child_load_error_desc')}
          retryLabel={t('try_again')}
          onRetry={() => void reload()}
        />
      </View>
    );
  }

  if (feedList.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Icon name="flash-outline" size={48} color="rgba(255,255,255,0.35)" />
        <Text style={styles.emptyTitle}>{t('no_shorts_assigned')}</Text>
        <Text style={styles.emptyDesc}>{t('no_shorts_assigned_desc')}</Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.container}>
      <FlashList
        ref={flatListRef}
        data={feedList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={{ activeIndex, isFocused, favoriteVideoIds }}
        drawDistance={pageHeight}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={pageHeight}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emptyTitle: { ...typography.h3, color: '#fff', textAlign: 'center' },
  emptyDesc: { ...typography.body, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
  page: {
    width: SCREEN_WIDTH,
    justifyContent: 'flex-end',
    backgroundColor: '#000',
  },
  fullImage: { ...StyleSheet.absoluteFillObject },
  tapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(123, 77, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  heartBurst: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
  },
  shortBadge: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: BRAND_ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: BRAND_ACCENT,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  shortBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  sideActions: {
    position: 'absolute',
    right: spacing.md,
    bottom: 140,
    gap: spacing.md,
    zIndex: 10,
  },
  actionBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  actionBtnActive: {
    backgroundColor: 'rgba(255, 77, 184, 0.25)',
    borderColor: 'rgba(255, 77, 184, 0.5)',
  },
  bottomInfo: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingRight: 72,
    gap: 6,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  channelAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  channelInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  feedTitle: {
    ...typography.h3,
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  feedChannel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '700',
    flex: 1,
  },
  hint: {
    ...typography.tiny,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND_CHILD_ACCENT,
  },
});
