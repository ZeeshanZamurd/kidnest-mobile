import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { lockToLandscape, lockToPortrait } from '../../utils/deviceOrientation';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import Video, { type VideoRef } from 'react-native-video';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchVideoById, formatDuration, type VideoDetail } from '../../api/browse';
import { recordChildWatch } from '../../api/watch';
import { useAppStore } from '../../store/useAppStore';
import { useChildLibrary } from '../../hooks/useChildLibrary';
import { normalizeCategory } from '../../utils/videoMapper';
import VideoCard from '../../components/video/VideoCard';
import { typography, radius, spacing } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');
const SHORT_WIDTH = Math.min(width * 0.55, 260);
const SHORT_HEIGHT = Math.round((SHORT_WIDTH * 16) / 9);
const DESCRIPTION_PREVIEW_LINES = 2;
const DESCRIPTION_COLLAPSE_CHARS = 100;
const CONTROLS_HIDE_MS = 3000;
const CONTROLS_HEIGHT = 92;
const THUMB_SIZE = 12;
/** Target ~1 minute of media buffered ahead of playback (YouTube-style). */
const BUFFER_AHEAD_MS = 60_000;
const VIDEO_BUFFER_CONFIG = {
  minBufferMs: BUFFER_AHEAD_MS,
  maxBufferMs: BUFFER_AHEAD_MS * 2,
  bufferForPlaybackMs: 2_500,
  bufferForPlaybackAfterRebufferMs: 5_000,
};
const PREFERRED_FORWARD_BUFFER_SECONDS = 60;

function SeekBar({
  progress,
  buffered,
  duration,
  onSeek,
  onSeekStart,
  onSeekEnd,
}: {
  progress: number;
  buffered: number;
  duration: number;
  onSeek: (time: number) => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
}) {
  const trackWidth = useRef(0);
  const trackWidthShared = useSharedValue(0);
  const progressShared = useSharedValue(0);
  const bufferedShared = useSharedValue(0);
  const scrubbingRef = useRef(false);

  useEffect(() => {
    if (!scrubbingRef.current) {
      progressShared.value = progress;
    }
  }, [progress, progressShared]);

  useEffect(() => {
    bufferedShared.value = buffered;
  }, [buffered, bufferedShared]);

  const seekAtX = useCallback(
    (x: number) => {
      if (duration <= 0 || trackWidth.current <= 0) return;
      const ratio = Math.max(0, Math.min(1, x / trackWidth.current));
      progressShared.value = ratio;
      onSeek(ratio * duration);
    },
    [duration, onSeek, progressShared],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          scrubbingRef.current = true;
          onSeekStart();
          seekAtX(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          seekAtX(evt.nativeEvent.locationX);
        },
        onPanResponderRelease: () => {
          scrubbingRef.current = false;
          onSeekEnd();
        },
        onPanResponderTerminate: () => {
          scrubbingRef.current = false;
          onSeekEnd();
        },
      }),
    [onSeekEnd, onSeekStart, seekAtX],
  );

  const bufferStyle = useAnimatedStyle(() => ({
    width: trackWidthShared.value * bufferedShared.value,
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: trackWidthShared.value * progressShared.value,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: trackWidthShared.value * progressShared.value - THUMB_SIZE / 2 },
    ],
  }));

  return (
    <View
      style={styles.progressTrackHit}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        trackWidth.current = w;
        trackWidthShared.value = w;
      }}
      {...panResponder.panHandlers}
    >
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBuffer, bufferStyle]} />
        <Animated.View style={[styles.progressFill, fillStyle]} />
      </View>
      <Animated.View style={[styles.progressThumb, thumbStyle]} />
    </View>
  );
}

type Route = RouteProp<RootStackParamList, 'VideoPlayer'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function resolveWatchUrl(video: VideoDetail): string | null {
  if (video.youtubeUrl) return video.youtubeUrl;
  if (video.youtubeVideoId) {
    return video.contentType === 'SHORT'
      ? `https://www.youtube.com/shorts/${video.youtubeVideoId}`
      : `https://www.youtube.com/watch?v=${video.youtubeVideoId}`;
  }
  return null;
}

function formatPlaybackTime(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return '0:00';
  const total = Math.floor(secs);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoPlayerScreen() {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const videoHeight = Math.round((windowWidth * 9) / 16);
  const role = useAppStore((s) => s.role);
  const activeChildId = useAppStore((s) => s.activeChildId);
  const toggleFavorite = useAppStore((s) => s.toggleVideoFavorite);
  const { getRelatedVideos, isChannelAssigned } = useChildLibrary(
    role === 'child' ? activeChildId : null,
  );
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [playbackTime, setPlaybackTime] = useState({ current: 0, duration: 0 });
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionTruncated, setDescriptionTruncated] = useState(false);
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSeeking, setIsSeeking] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hasDisplayedFrame, setHasDisplayedFrame] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedSecs, setBufferedSecs] = useState(0);
  const progressRef = useRef({ current: 0, duration: 0 });
  const videoRef = useRef<VideoRef>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsOpacity = useSharedValue(1);

  const flushProgress = useCallback(() => {
    if (role !== 'child' || !activeChildId || !video) return;
    const { current, duration } = progressRef.current;
    if (duration <= 0 || current <= 3) return;
    const progressPercent = Math.min(100, (current / duration) * 100);
    void recordChildWatch(activeChildId, video.id, {
      progressPercent,
      watchedSecs: Math.floor(current),
    }).catch(() => {});
  }, [role, activeChildId, video]);

  const clearHideControlsTimer = useCallback(() => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
      hideControlsTimer.current = null;
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    setPaused(false);
    setPlaybackTime({ current: 0, duration: 0 });
    setDescriptionExpanded(false);
    setDescriptionTruncated(false);
    setControlsVisible(true);
    clearHideControlsTimer();
    progressRef.current = { current: 0, duration: 0 };
    void fetchVideoById(route.params.videoId)
      .then(setVideo)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load video');
        setVideo(null);
      })
      .finally(() => setLoading(false));
  }, [route.params.videoId, clearHideControlsTimer]);

  const scheduleHideControls = useCallback(() => {
    clearHideControlsTimer();
    hideControlsTimer.current = setTimeout(() => {
      setControlsVisible(false);
    }, CONTROLS_HIDE_MS);
  }, [clearHideControlsTimer]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
  }, []);

  useEffect(() => {
    controlsOpacity.value = withTiming(controlsVisible ? 1 : 0, { duration: 220 });
  }, [controlsVisible, controlsOpacity]);

  useEffect(() => {
    if (paused || isSeeking) {
      revealControls();
      clearHideControlsTimer();
      return;
    }
    if (controlsVisible) {
      scheduleHideControls();
    }
    return clearHideControlsTimer;
  }, [
    paused,
    isSeeking,
    controlsVisible,
    revealControls,
    clearHideControlsTimer,
    scheduleHideControls,
  ]);

  const controlsOverlayStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const restorePortrait = useCallback(() => {
    lockToPortrait();
    if (Platform.OS === 'android') {
      StatusBar.setHidden(false, 'fade');
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    setFullscreen(false);
    restorePortrait();
  }, [restorePortrait]);

  const toggleFullscreen = useCallback(() => {
    setFullscreen((prev) => {
      if (prev) {
        restorePortrait();
        return false;
      }
      lockToLandscape();
      if (Platform.OS === 'android') {
        StatusBar.setHidden(true, 'fade');
      }
      return true;
    });
  }, [restorePortrait]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setPaused(true);
        setFullscreen(false);
        setControlsVisible(true);
        clearHideControlsTimer();
        restorePortrait();
        flushProgress();
      };
    }, [flushProgress, restorePortrait, clearHideControlsTimer]),
  );

  const togglePlayPause = useCallback(() => {
    setPaused((prev) => !prev);
  }, []);

  const handleVideoTap = useCallback(() => {
    if (!controlsVisible) {
      revealControls();
      return;
    }
    togglePlayPause();
  }, [controlsVisible, revealControls, togglePlayPause]);

  const handleControlInteraction = useCallback(() => {
    revealControls();
  }, [revealControls]);

  const handleSeekStart = useCallback(() => {
    setIsSeeking(true);
    revealControls();
    clearHideControlsTimer();
  }, [revealControls, clearHideControlsTimer]);

  const handleSeekEnd = useCallback(() => {
    setIsSeeking(false);
  }, []);

  const seekTo = useCallback((time: number) => {
    const duration = progressRef.current.duration || playbackTime.duration;
    const clamped = Math.max(0, Math.min(time, duration || time));
    videoRef.current?.seek(clamped);
    progressRef.current = { current: clamped, duration };
    setPlaybackTime((prev) => ({ ...prev, current: clamped, duration: duration || prev.duration }));
  }, [playbackTime.duration]);

  const openChannel = () => {
    if (!video) return;
    setPaused(true);
    if (role === 'child') {
      if (!isChannelAssigned(video.channelId)) return;
      navigation.navigate('ChildChannelDetail', { channelId: video.channelId });
      return;
    }
    navigation.navigate('ChannelDetail', { channelId: video.channelId });
  };

  const relatedVideos = useMemo(() => {
    if (!video || role !== 'child') return [];
    const category = normalizeCategory(
      video.primaryCategory?.slug ?? video.categories[0]?.slug,
    );
    return getRelatedVideos(video.id, category);
  }, [video, role, getRelatedVideos]);

  const channelNavigable = role !== 'child' || (video ? isChannelAssigned(video.channelId) : false);

  const isShort = video?.contentType === 'SHORT';
  const streamUri = video?.streamUrl ?? null;
  const watchUrl = useMemo(() => (video ? resolveWatchUrl(video) : null), [video]);

  const videoSource = useMemo(
    () =>
      streamUri
        ? {
            uri: streamUri,
            bufferConfig: VIDEO_BUFFER_CONFIG,
          }
        : undefined,
    [streamUri],
  );

  useEffect(() => {
    if (!streamUri) return;
    setHasDisplayedFrame(false);
    setIsBuffering(false);
    setBufferedSecs(0);
  }, [streamUri]);

  const showBufferingOverlay = !hasDisplayedFrame || isBuffering;

  useEffect(() => {
    if (role !== 'child' || !activeChildId || !video || paused || !streamUri) return;
    const interval = setInterval(flushProgress, 15000);
    return () => clearInterval(interval);
  }, [role, activeChildId, video, paused, streamUri, flushProgress]);

  const openExternal = () => {
    if (!watchUrl) return;
    void Linking.openURL(watchUrl);
  };

  if (loading) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (!video || error) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>{error || 'Video not found'}</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const videoWrapStyle = fullscreen
    ? styles.videoWrapFullscreen
    : isShort
      ? styles.shortVideoWrap
      : [styles.videoWrap, { height: videoHeight }];

  const renderPlayer = () => {
    if (streamUri) {
      const progress =
        playbackTime.duration > 0
          ? Math.min(1, playbackTime.current / playbackTime.duration)
          : 0;
      const bufferedProgress =
        playbackTime.duration > 0
          ? Math.min(1, bufferedSecs / playbackTime.duration)
          : 0;

      return (
        <View style={videoWrapStyle}>
          <Video
            ref={videoRef}
            source={videoSource}
            style={[
              fullscreen ? styles.videoFullscreen : isShort ? styles.shortVideo : styles.video,
            ]}
            resizeMode={isShort || fullscreen ? 'cover' : 'contain'}
            paused={paused}
            poster={video.thumbnailUrl ?? undefined}
            posterResizeMode="cover"
            controls={false}
            progressUpdateInterval={250}
            repeat
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
            preferredForwardBufferDuration={PREFERRED_FORWARD_BUFFER_SECONDS}
            automaticallyWaitsToMinimizeStalling
            bufferConfig={VIDEO_BUFFER_CONFIG}
            onLoadStart={() => {
              setHasDisplayedFrame(false);
              setIsBuffering(true);
            }}
            onReadyForDisplay={() => {
              setHasDisplayedFrame(true);
            }}
            onBuffer={(e) => {
              setIsBuffering(e.isBuffering);
            }}
            onProgress={(e) => {
              if (e.playableDuration > 0) {
                setBufferedSecs(e.playableDuration);
              }
              if (isSeeking) return;
              const duration =
                e.seekableDuration > 0
                  ? e.seekableDuration
                  : video.durationSecs || e.playableDuration || 1;
              progressRef.current = { current: e.currentTime, duration };
              setPlaybackTime({ current: e.currentTime, duration });
            }}
            onLoad={(e) => {
              const duration = e.duration || video.durationSecs || 0;
              progressRef.current = { current: 0, duration };
              setPlaybackTime({ current: 0, duration });
            }}
            onEnd={flushProgress}
          />

          {showBufferingOverlay && (
            <View style={styles.bufferingOverlay} pointerEvents="none">
              <ActivityIndicator color="#fff" size="large" />
            </View>
          )}

          <Pressable
            style={[styles.videoTapLayer, { bottom: controlsVisible ? CONTROLS_HEIGHT : 0 }]}
            onPress={handleVideoTap}
            accessibilityRole="button"
            accessibilityLabel={paused ? t('play') : t('pause')}
          />

          <Animated.View
            style={[styles.controlsChrome, controlsOverlayStyle]}
            pointerEvents={controlsVisible ? 'box-none' : 'none'}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.65)', 'transparent']}
              style={styles.topControlsGradient}
              pointerEvents="box-none"
            >
              <Pressable
                style={styles.videoBackBtn}
                onPress={() => {
                  handleControlInteraction();
                  if (fullscreen) {
                    exitFullscreen();
                    return;
                  }
                  navigation.goBack();
                }}
              >
                <Icon name="chevron-back" size={26} color="#fff" />
              </Pressable>
            </LinearGradient>

            {paused && hasDisplayedFrame && !isBuffering && (
              <Pressable
                style={[styles.playOverlay, { bottom: CONTROLS_HEIGHT }]}
                onPress={() => {
                  handleControlInteraction();
                  togglePlayPause();
                }}
              >
                <View style={styles.playPauseCircle}>
                  <Icon name="play" size={40} color="#fff" />
                </View>
              </Pressable>
            )}

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={styles.controlsGradient}
              pointerEvents="box-none"
            >
              <View style={styles.controlBar}>
                <SeekBar
                  progress={progress}
                  buffered={bufferedProgress}
                  duration={playbackTime.duration}
                  onSeek={seekTo}
                  onSeekStart={handleSeekStart}
                  onSeekEnd={handleSeekEnd}
                />
                <View style={styles.controlsRow}>
                  <Pressable
                    style={styles.controlPlayBtn}
                    onPress={() => {
                      handleControlInteraction();
                      togglePlayPause();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={paused ? t('play') : t('pause')}
                  >
                    <Icon name={paused ? 'play' : 'pause'} size={20} color="#fff" />
                  </Pressable>
                  <Text style={styles.timeText}>
                    {formatPlaybackTime(playbackTime.current)}
                    {' / '}
                    {formatPlaybackTime(playbackTime.duration)}
                  </Text>
                  <Pressable
                    style={styles.fullscreenBtn}
                    onPress={() => {
                      handleControlInteraction();
                      toggleFullscreen();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={fullscreen ? t('exit_fullscreen') : t('fullscreen')}
                  >
                    <Icon name={fullscreen ? 'contract' : 'expand'} size={20} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      );
    }

    return (
      <Pressable style={videoWrapStyle} onPress={openExternal}>
        <Image
          source={{ uri: video.thumbnailUrl ?? '' }}
          style={isShort ? styles.shortVideo : styles.video}
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.externalPlay}>
          <View style={styles.externalPlayCircle}>
            <Icon name="logo-youtube" size={36} color="#fff" />
          </View>
          <Text style={styles.externalPlayText}>Tap to watch on YouTube</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.container,
        fullscreen && styles.fullscreen,
        isShort && styles.shortContainer,
        !fullscreen && { paddingTop: insets.top },
      ]}
    >
      {!streamUri && (
        <Pressable
          style={[styles.backBtn, { top: 8 }]}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={28} color="#fff" />
        </Pressable>
      )}

      {isShort && streamUri && controlsVisible && (
        <View style={[styles.shortBadge, { top: fullscreen ? insets.top + 12 : 12 }]}>
          <Icon name="flash" size={12} color="#fff" />
          <Text style={styles.shortBadgeText}>Short</Text>
        </View>
      )}

      {isShort && !streamUri && (
        <View style={[styles.shortBadge, { top: 12 }]}>
          <Icon name="flash" size={12} color="#fff" />
          <Text style={styles.shortBadgeText}>Short</Text>
        </View>
      )}

      {renderPlayer()}

      {!fullscreen && (
        <ScrollView
          style={styles.infoScroll}
          contentContainerStyle={[styles.info, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title} numberOfLines={2}>
            {video.title}
          </Text>
          {channelNavigable ? (
            <Pressable style={styles.channelRow} onPress={openChannel}>
              <Icon name="albums-outline" size={18} color="#c4b5fd" />
              <Text style={styles.channel}>{video.channelName}</Text>
              <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
            </Pressable>
          ) : (
            <View style={styles.channelRow}>
              <Icon name="albums-outline" size={18} color="#c4b5fd" />
              <Text style={styles.channel}>{video.channelName}</Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Icon name={isShort ? 'flash' : 'film-outline'} size={14} color="#fff" />
              <Text style={styles.metaPillText}>{isShort ? 'Short' : 'Video'}</Text>
            </View>
            {video.durationSecs ? (
              <View style={styles.metaPill}>
                <Icon name="time-outline" size={14} color="#fff" />
                <Text style={styles.metaPillText}>{formatDuration(video.durationSecs)}</Text>
              </View>
            ) : null}
          </View>
          {video.description ? (
            <View style={styles.descriptionBlock}>
              <Text
                style={styles.description}
                numberOfLines={descriptionExpanded ? undefined : DESCRIPTION_PREVIEW_LINES}
                onTextLayout={(e) => {
                  if (!descriptionExpanded) {
                    setDescriptionTruncated(
                      video.description.length > DESCRIPTION_COLLAPSE_CHARS &&
                        e.nativeEvent.lines.length >= DESCRIPTION_PREVIEW_LINES,
                    );
                  }
                }}
              >
                {video.description}
              </Text>
              {(descriptionTruncated || descriptionExpanded) && (
                <Pressable
                  onPress={() => setDescriptionExpanded((v) => !v)}
                  hitSlop={8}
                  style={styles.seeMoreBtn}
                >
                  <Text style={styles.seeMoreText}>
                    {descriptionExpanded ? t('see_less') : t('see_more')}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : null}
          {relatedVideos.length > 0 ? (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>{t('more_like_this')}</Text>
              <FlatList
                horizontal
                data={relatedVideos}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <VideoCard
                    video={item}
                    horizontal
                    onPress={() => navigation.replace('VideoPlayer', { videoId: item.id })}
                    onFavorite={() => toggleFavorite(item.id)}
                  />
                )}
              />
            </View>
          ) : null}
          {!streamUri && watchUrl ? (
            <Pressable onPress={openExternal} style={styles.youtubeLink}>
              <Icon name="open-outline" size={20} color="#fff" />
              <Text style={styles.youtubeLinkText}>Open in YouTube</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  shortContainer: { backgroundColor: '#0a0a0a' },
  fullscreen: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: 24 },
  fallbackText: { color: '#fff', textAlign: 'center', marginBottom: 16 },
  backLink: { padding: 12 },
  backLinkText: { color: '#a78bfa', fontWeight: '600' },
  backBtn: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortBadge: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(236, 72, 153, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  shortBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  videoWrap: {
    width: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  videoWrapFullscreen: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortVideoWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: '#0a0a0a',
  },
  video: { width: '100%', height: '100%' },
  shortVideo: {
    width: SHORT_WIDTH,
    height: SHORT_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  videoFullscreen: { width: '100%', height: '100%' },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  videoTapLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  controlsChrome: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  topControlsGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    justifyContent: 'flex-start',
    paddingTop: 6,
    paddingLeft: 8,
  },
  videoBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  controlsGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CONTROLS_HEIGHT + 12,
    zIndex: 4,
    justifyContent: 'flex-end',
  },
  controlBar: {
    height: CONTROLS_HEIGHT,
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 4,
    justifyContent: 'flex-end',
    gap: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 36,
  },
  controlPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrackHit: {
    width: '100%',
    height: 28,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressBuffer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff0000',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    top: 8,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#ff0000',
  },
  timeText: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  fullscreenBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  externalPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  externalPlayCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalPlayText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  infoScroll: { flex: 1, backgroundColor: '#0a0a0a' },
  info: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: 8 },
  title: { ...typography.bodyBold, color: '#fff', lineHeight: 22 },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channel: { ...typography.body, color: '#c4b5fd', flex: 1, fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  metaPillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  descriptionBlock: { gap: 4 },
  description: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 18,
  },
  seeMoreBtn: { alignSelf: 'flex-start' },
  seeMoreText: {
    ...typography.caption,
    color: '#a78bfa',
    fontWeight: '700',
  },
  relatedSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  relatedTitle: {
    ...typography.bodyBold,
    color: '#fff',
  },
  youtubeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
    paddingVertical: 10,
  },
  youtubeLinkText: { color: '#fff', ...typography.caption, fontWeight: '600' },
});
