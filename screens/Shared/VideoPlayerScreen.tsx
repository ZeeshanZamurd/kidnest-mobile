import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
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
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchVideoById, type VideoDetail, type VideoStream } from '../../api/browse';
import { recordChildWatch } from '../../api/watch';
import { useAppStore } from '../../store/useAppStore';
import { useChildLibrary } from '../../hooks/useChildLibrary';
import { useChildFavorites } from '../../hooks/useChildFavorites';
import { normalizeCategory } from '../../utils/videoMapper';
import VideoDetailPanel from '../../components/video/VideoDetailPanel';
import VideoPlayerOverlay from '../../components/video/player/VideoPlayerOverlay';
import VideoPosterLoader from '../../components/video/player/VideoPosterLoader';
import PlayerEndOverlay from '../../components/video/player/PlayerEndOverlay';
import { playerTheme } from '../../components/video/player/playerTheme';
import { BRAND_PRIMARY } from '../../constants/branding';
import { useTheme } from '../../context/ThemeContext';
import type { RootStackParamList } from '../../navigation/types';
import { markPlaybackStarted, shouldShowVideoBuffering } from '../../utils/videoBuffering';
import { buildCachedVideoSource } from '../../services/cache/videoCache';

const { width } = Dimensions.get('window');
const SHORT_WIDTH = Math.min(width * 0.55, 260);
const SHORT_HEIGHT = Math.round((SHORT_WIDTH * 16) / 9);
const BUFFER_AHEAD_MS = 60_000;
const VIDEO_BUFFER_CONFIG = {
  minBufferMs: BUFFER_AHEAD_MS,
  maxBufferMs: BUFFER_AHEAD_MS * 2,
  bufferForPlaybackMs: 2_500,
  bufferForPlaybackAfterRebufferMs: 5_000,
};
const PREFERRED_FORWARD_BUFFER_SECONDS = 60;
const AUTOPLAY_COUNTDOWN_SECS = 5;

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

export default function VideoPlayerScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const videoHeight = Math.round(windowWidth * (9 / 16));
  const previewTitle = route.params.title;
  const previewThumb = route.params.thumbnailUrl;
  const role = useAppStore((s) => s.role);
  const activeChildId = useAppStore((s) => s.activeChildId);
  const autoplayEnabled = useAppStore((s) => s.autoplayEnabled);
  const toggleFavorite = useAppStore((s) => s.toggleVideoFavorite);
  const { toggleVideo, toggleChannel, isVideoFavorite, isChannelFavorite } =
    useChildFavorites(role === 'child' ? activeChildId : null);
  const { getRelatedVideos, getNextVideo, getPrevVideo, isChannelAssigned } = useChildLibrary(
    role === 'child' ? activeChildId : null,
  );

  const [paused, setPaused] = useState(false);
  const [immersiveFullscreen, setImmersiveFullscreen] = useState(false);
  const [playbackTime, setPlaybackTime] = useState({ current: 0, duration: 0 });
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [error, setError] = useState('');
  const [isSeeking, setIsSeeking] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hasDisplayedFrame, setHasDisplayedFrame] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isStalled, setIsStalled] = useState(false);
  const [bufferedSecs, setBufferedSecs] = useState(0);
  const [playbackEnded, setPlaybackEnded] = useState(false);
  const [countdownSecs, setCountdownSecs] = useState<number | null>(null);
  const progressRef = useRef({ current: 0, duration: 0 });
  const videoRef = useRef<VideoRef>(null);
  const scrollRef = useRef<ScrollView>(null);
  const loadRequestRef = useRef(0);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedVideoIdRef = useRef<string | null>(null);
  const qualityChangeRef = useRef(false);
  const lastProgressAtRef = useRef(Date.now());
  const [switchingVideo, setSwitchingVideo] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
  const [qualityMenuVisible, setQualityMenuVisible] = useState(false);
  const [shelfVisible, setShelfVisible] = useState(false);

  const clearCountdown = useCallback(() => {
    setCountdownSecs(null);
  }, []);

  const flushProgress = useCallback(() => {
    if (role !== 'child' || !activeChildId || !video) return;
    const { current, duration } = progressRef.current;
    if (duration <= 0 || current <= 3) return;
    void recordChildWatch(activeChildId, video.id, {
      progressPercent: Math.min(100, (current / duration) * 100),
      watchedSecs: Math.floor(current),
    }).catch(() => {});
  }, [role, activeChildId, video]);

  const clearHideControlsTimer = useCallback(() => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
      hideControlsTimer.current = null;
    }
  }, []);

  const resetPlayback = useCallback(() => {
    setPaused(false);
    setPlaybackTime({ current: 0, duration: 0 });
    progressRef.current = { current: 0, duration: 0 };
    loadedVideoIdRef.current = null;
    setHasDisplayedFrame(false);
    setIsBuffering(true);
    setIsStalled(false);
    setBufferedSecs(0);
    setIsSeeking(false);
    setControlsVisible(true);
    setSelectedQuality(null);
    setQualityMenuVisible(false);
    setShelfVisible(false);
    setPlaybackEnded(false);
    setCountdownSecs(null);
    clearHideControlsTimer();
  }, [clearHideControlsTimer]);

  const loadVideo = useCallback(
    async (videoId: string, { scrollToTop = true }: { scrollToTop?: boolean } = {}) => {
      if (videoId === video?.id) return;
      flushProgress();
      resetPlayback();
      const reqId = ++loadRequestRef.current;
      setSwitchingVideo(true);
      setError('');
      try {
        const next = await fetchVideoById(videoId);
        if (loadRequestRef.current !== reqId) return;
        setVideo(next);
        if (scrollToTop) {
          scrollRef.current?.scrollTo({ y: 0, animated: false });
        }
      } catch (err) {
        if (loadRequestRef.current !== reqId) return;
        setError(err instanceof Error ? err.message : 'Could not load video');
      } finally {
        if (loadRequestRef.current === reqId) setSwitchingVideo(false);
      }
    },
    [video?.id, flushProgress, resetPlayback],
  );

  useEffect(() => {
    let cancelled = false;
    setError('');
    setVideo(null);
    resetPlayback();
    void fetchVideoById(route.params.videoId)
      .then((v) => {
        if (!cancelled) setVideo(v);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load video');
      });
    return () => {
      cancelled = true;
    };
  }, [route.params.videoId, resetPlayback]);

  useEffect(() => {
    if (!video || video.contentType !== 'SHORT' || role !== 'child') return;
    navigation.replace('ChildTabs', {
      screen: 'ChildFeed',
      params: { videoId: video.id, channelId: video.channelId },
    });
  }, [video, role, navigation]);

  const scheduleHideControls = useCallback(() => {
    clearHideControlsTimer();
    hideControlsTimer.current = setTimeout(
      () => setControlsVisible(false),
      playerTheme.controlsHideMs,
    );
  }, [clearHideControlsTimer]);

  const revealControls = useCallback(() => setControlsVisible(true), []);
  const hideControls = useCallback(() => setControlsVisible(false), []);

  useEffect(() => {
    if (playbackEnded) {
      clearHideControlsTimer();
      setControlsVisible(false);
      return;
    }
    if (paused || isSeeking || (immersiveFullscreen && shelfVisible)) {
      revealControls();
      clearHideControlsTimer();
      return;
    }
    if (controlsVisible) scheduleHideControls();
    return clearHideControlsTimer;
  }, [
    paused,
    isSeeking,
    shelfVisible,
    immersiveFullscreen,
    controlsVisible,
    playbackEnded,
    revealControls,
    clearHideControlsTimer,
    scheduleHideControls,
  ]);

  useEffect(() => {
    if (!immersiveFullscreen) return;
    if (!controlsVisible) setShelfVisible(false);
  }, [controlsVisible, immersiveFullscreen]);

  const restorePortrait = useCallback(() => {
    lockToPortrait();
    StatusBar.setHidden(false, 'fade');
  }, []);

  const exitImmersiveFullscreen = useCallback(() => {
    setImmersiveFullscreen(false);
    restorePortrait();
  }, [restorePortrait]);

  const toggleFullscreen = useCallback(() => {
    if (video?.contentType === 'SHORT') return;
    if (immersiveFullscreen) {
      exitImmersiveFullscreen();
      return;
    }
    lockToLandscape();
    StatusBar.setHidden(true, 'fade');
    setImmersiveFullscreen(true);
  }, [exitImmersiveFullscreen, immersiveFullscreen, video?.contentType]);

  useFocusEffect(
    useCallback(
      () => () => {
        setImmersiveFullscreen(false);
        setPaused(true);
        setControlsVisible(true);
        clearHideControlsTimer();
        restorePortrait();
        flushProgress();
      },
      [flushProgress, restorePortrait, clearHideControlsTimer],
    ),
  );

  const seekTo = useCallback(
    (time: number) => {
      const duration = progressRef.current.duration || playbackTime.duration;
      const clamped = Math.max(0, Math.min(time, duration || time));
      videoRef.current?.seek(clamped);
      progressRef.current = { current: clamped, duration };
      setPlaybackTime((p) => ({ ...p, current: clamped, duration: duration || p.duration }));
    },
    [playbackTime.duration],
  );

  const relatedVideos = useMemo(() => {
    if (!video || role !== 'child') return [];
    const cat = normalizeCategory(video.primaryCategory?.slug ?? video.categories[0]?.slug);
    return getRelatedVideos(video.id, cat, 12, video.contentType);
  }, [video, role, getRelatedVideos]);

  const nextVideo = useMemo(() => {
    if (!video || role !== 'child') return null;
    const cat = normalizeCategory(video.primaryCategory?.slug ?? video.categories[0]?.slug);
    return getNextVideo(video.id, cat, video.contentType);
  }, [video, role, getNextVideo]);

  const prevVideo = useMemo(() => {
    if (!video || role !== 'child') return null;
    const cat = normalizeCategory(video.primaryCategory?.slug ?? video.categories[0]?.slug);
    return getPrevVideo(video.id, cat, video.contentType);
  }, [video, role, getPrevVideo]);

  const suggestedVideos = useMemo(
    () => (nextVideo ? relatedVideos.filter((v) => v.id !== nextVideo.id) : relatedVideos),
    [relatedVideos, nextVideo],
  );

  const shelfVideos = useMemo(() => {
    if (!video || role !== 'child') return [];
    const items = [...relatedVideos];
    if (nextVideo && !items.some((v) => v.id === nextVideo.id)) {
      items.unshift(nextVideo);
    }
    return items.slice(0, 16);
  }, [video, role, relatedVideos, nextVideo]);

  const toggleShelf = useCallback(() => {
    setShelfVisible((v) => !v);
  }, []);

  const goToVideo = useCallback(
    (videoId: string, contentType?: VideoDetail['contentType']) => {
      clearCountdown();
      setPlaybackEnded(false);
      if (contentType === 'SHORT' && role === 'child') {
        navigation.replace('ChildTabs', {
          screen: 'ChildFeed',
          params: { videoId, channelId: video?.channelId },
        });
        return;
      }
      void loadVideo(videoId);
    },
    [clearCountdown, loadVideo, navigation, role, video?.channelId],
  );

  const handleVideoEnd = useCallback(() => {
    flushProgress();
    setPaused(true);
    if (role === 'child') {
      setPlaybackEnded(true);
      setControlsVisible(false);
      clearHideControlsTimer();
      if (autoplayEnabled && nextVideo) {
        setCountdownSecs(AUTOPLAY_COUNTDOWN_SECS);
      }
      return;
    }
  }, [
    flushProgress,
    role,
    autoplayEnabled,
    nextVideo,
    clearHideControlsTimer,
  ]);

  useEffect(() => {
    if (countdownSecs == null) return;
    if (countdownSecs <= 0) {
      clearCountdown();
      if (nextVideo) {
        goToVideo(nextVideo.id, nextVideo.contentType);
      }
      return;
    }
    const id = setTimeout(() => {
      setCountdownSecs((s) => (s == null ? null : s - 1));
    }, 1000);
    return () => clearTimeout(id);
  }, [countdownSecs, nextVideo, goToVideo, clearCountdown]);

  useEffect(() => {
    if (!isBuffering || paused || !hasDisplayedFrame || playbackEnded) {
      setIsStalled(false);
      return;
    }
    const id = setInterval(() => {
      setIsStalled(Date.now() - lastProgressAtRef.current > 450);
    }, 200);
    return () => clearInterval(id);
  }, [isBuffering, paused, hasDisplayedFrame, playbackEnded]);

  const replayVideo = useCallback(() => {
    clearCountdown();
    setPlaybackEnded(false);
    seekTo(0);
    setPaused(false);
    setControlsVisible(true);
  }, [clearCountdown, seekTo]);

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

  const channelNavigable = role !== 'child' || (video ? isChannelAssigned(video.channelId) : false);
  const isShort = video?.contentType === 'SHORT';
  const useShortLayout = isShort && role !== 'child';

  const availableStreams = useMemo<VideoStream[]>(() => {
    if (!video) return [];
    if (video.streams?.length) return video.streams;
    if (video.streamUrl) {
      return [
        {
          quality: '1080p',
          label: '1080p',
          height: 1080,
          streamUrl: video.streamUrl,
          isDefault: true,
        },
      ];
    }
    return [];
  }, [video]);

  const activeStream = useMemo(() => {
    if (!availableStreams.length) return null;
    if (selectedQuality) {
      return availableStreams.find((s) => s.quality === selectedQuality) ?? availableStreams[0];
    }
    return availableStreams.find((s) => s.isDefault) ?? availableStreams[0];
  }, [availableStreams, selectedQuality]);

  const streamUri = activeStream?.streamUrl ?? video?.streamUrl ?? null;
  const watchUrl = useMemo(() => (video ? resolveWatchUrl(video) : null), [video]);
  const videoSource = useMemo(() => buildCachedVideoSource(streamUri), [streamUri]);

  const selectQuality = useCallback(
    (quality: string) => {
      if (quality === (selectedQuality ?? activeStream?.quality)) {
        setQualityMenuVisible(false);
        return;
      }
      const resumeAt = progressRef.current.current;
      qualityChangeRef.current = true;
      setHasDisplayedFrame(false);
      setIsBuffering(true);
      setSelectedQuality(quality);
      setQualityMenuVisible(false);
      setTimeout(() => {
        videoRef.current?.seek(resumeAt);
      }, 120);
    },
    [activeStream?.quality, selectedQuality],
  );

  useEffect(() => {
    if (!controlsVisible) setQualityMenuVisible(false);
  }, [controlsVisible]);

  useEffect(() => {
    if (!streamUri) return;
    if (qualityChangeRef.current) {
      qualityChangeRef.current = false;
      return;
    }
    setHasDisplayedFrame(false);
    setIsBuffering(false);
    setBufferedSecs(0);
  }, [streamUri]);

  useEffect(() => {
    if (role !== 'child' || !activeChildId || !video || paused || !streamUri) return;
    const id = setInterval(flushProgress, 15000);
    return () => clearInterval(id);
  }, [role, activeChildId, video, paused, streamUri, flushProgress]);

  if (!video) {
    const screenColors = [colors.background, colors.backgroundSecondary, colors.background] as const;
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[...screenColors]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.headerBack, { backgroundColor: colors.surface }]}
          >
            <Icon name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={[styles.playerWrap, { height: videoHeight + 8 }]}>
          <View style={styles.playerFrame}>
            {previewThumb ? (
              <VideoPosterLoader thumbnailUrl={previewThumb} />
            ) : (
              <View style={styles.inlineLoader}>
                <ActivityIndicator color="#fff" size="large" />
              </View>
            )}
          </View>
        </View>
        {previewTitle ? (
          <View style={styles.previewMeta}>
            <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={2}>
              {previewTitle}
            </Text>
          </View>
        ) : null}
        {error ? (
          <View style={styles.previewError}>
            <Text style={[styles.errText, { color: colors.text }]}>{error}</Text>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={[styles.backLink, { color: colors.primary }]}>{t('go_back')}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  }

  const progress =
    playbackTime.duration > 0 ? Math.min(1, playbackTime.current / playbackTime.duration) : 0;
  const bufferedProgress =
    playbackTime.duration > 0 ? Math.min(1, bufferedSecs / playbackTime.duration) : 0;
  const showBuffering = shouldShowVideoBuffering(
    hasDisplayedFrame,
    isBuffering,
    isStalled,
  );
  const showPoster =
    Boolean(video.thumbnailUrl) && (!hasDisplayedFrame || switchingVideo);

  const renderPlayer = () => {
    if (!streamUri) {
      return (
        <Pressable style={styles.playerFrame} onPress={() => watchUrl && Linking.openURL(watchUrl)}>
          <Image source={{ uri: video.thumbnailUrl ?? '' }} style={styles.video} />
          <View style={styles.ytOverlay}>
            <Icon name="logo-youtube" size={40} color="#fff" />
          </View>
        </Pressable>
      );
    }

    return (
      <View style={[styles.playerFrame, immersiveFullscreen && styles.playerFrameImmersive]}>
        {showPoster && video.thumbnailUrl ? (
          <VideoPosterLoader thumbnailUrl={video.thumbnailUrl} />
        ) : null}

        <Video
          key={video.id}
          ref={videoRef}
          source={videoSource}
          style={[
            styles.video,
            showPoster && styles.videoUntilReady,
            isShort && !immersiveFullscreen && { width: SHORT_WIDTH, height: SHORT_HEIGHT, alignSelf: 'center' },
            useShortLayout && !immersiveFullscreen && styles.videoShortParent,
          ]}
          resizeMode={isShort && !immersiveFullscreen ? 'cover' : 'contain'}
          paused={paused}
          poster={video.thumbnailUrl ?? undefined}
          posterResizeMode="cover"
          controls={false}
          repeat={false}
          progressUpdateInterval={250}
          playInBackground={false}
          playWhenInactive={false}
          bufferConfig={VIDEO_BUFFER_CONFIG}
          preferredForwardBufferDuration={PREFERRED_FORWARD_BUFFER_SECONDS}
          onProgress={(e) => {
            lastProgressAtRef.current = Date.now();
            if (markPlaybackStarted(e.currentTime)) {
              setHasDisplayedFrame(true);
            }
            if (e.playableDuration > 0) setBufferedSecs(e.playableDuration);
            if (isSeeking) return;
            const duration =
              e.seekableDuration > 0 ? e.seekableDuration : video.durationSecs || 1;
            progressRef.current = { current: e.currentTime, duration };
            setPlaybackTime({ current: e.currentTime, duration });
          }}
          onLoad={(e) => {
            const d = e.duration || video.durationSecs || 0;
            const isNewVideo = loadedVideoIdRef.current !== video.id;
            const current = isNewVideo ? 0 : progressRef.current.current;
            loadedVideoIdRef.current = video.id;
            progressRef.current = { current, duration: d };
            setPlaybackTime({ current, duration: d });
            setPaused(false);
          }}
          onEnd={handleVideoEnd}
          onBuffer={(e) => {
            setIsBuffering(e.isBuffering);
          }}
          onReadyForDisplay={() => {
            setHasDisplayedFrame(true);
            setIsBuffering(false);
            setIsStalled(false);
            setPaused(false);
          }}
          onLoadStart={() => {
            setHasDisplayedFrame(false);
            setIsBuffering(true);
          }}
        />

        <VideoPlayerOverlay
          paused={paused}
          controlsVisible={controlsVisible}
          hasDisplayedFrame={hasDisplayedFrame}
          isBuffering={showBuffering}
          switchingVideo={switchingVideo}
          immersiveFullscreen={immersiveFullscreen}
          isShort={isShort}
          duration={playbackTime.duration}
          currentTime={playbackTime.current}
          progress={progress}
          buffered={bufferedProgress}
          showPrev={role === 'child' && Boolean(prevVideo)}
          showNext={role === 'child' && Boolean(nextVideo)}
          insetsTop={insets.top}
          insetsLeft={insets.left}
          insetsBottom={insets.bottom}
          availableStreams={availableStreams}
          activeStreamLabel={activeStream?.label ?? 'Quality'}
          selectedQuality={selectedQuality ?? activeStream?.quality ?? null}
          qualityMenuVisible={qualityMenuVisible}
          onTogglePlay={() => setPaused((p) => !p)}
          onPlay={() => setPaused(false)}
          onRevealControls={revealControls}
          onHideControls={hideControls}
          onPrev={
            prevVideo
              ? () => goToVideo(prevVideo.id, prevVideo.contentType)
              : undefined
          }
          onNext={
            nextVideo
              ? () => goToVideo(nextVideo.id, nextVideo.contentType)
              : undefined
          }
          onFullscreen={toggleFullscreen}
          onExitFullscreen={exitImmersiveFullscreen}
          onSeek={seekTo}
          onSeekStart={() => {
            setIsSeeking(true);
            revealControls();
            clearHideControlsTimer();
          }}
          onSeekEnd={() => setIsSeeking(false)}
          onToggleQualityMenu={() => setQualityMenuVisible((v) => !v)}
          onSelectQuality={selectQuality}
          showVideoShelf={role === 'child' && shelfVideos.length > 0 && immersiveFullscreen}
          shelfVisible={shelfVisible}
          shelfVideos={shelfVideos}
          currentVideoId={video.id}
          shelfTitle={t('suggested_for_you')}
          onToggleShelf={toggleShelf}
          onSelectShelfVideo={(id) => {
            setShelfVisible(false);
            const picked =
              shelfVideos.find((v) => v.id === id) ??
              suggestedVideos.find((v) => v.id === id) ??
              (nextVideo?.id === id ? nextVideo : null);
            goToVideo(id, picked?.contentType);
          }}
          hasPosterLoader={showPoster}
          playbackEnded={playbackEnded && role === 'child'}
          endOverlay={
            playbackEnded && role === 'child' ? (
              <PlayerEndOverlay
                nextVideo={nextVideo}
                suggestions={shelfVideos}
                countdownSecs={countdownSecs}
                autoplayEnabled={autoplayEnabled}
                labels={{
                  upNext: t('up_next'),
                  playingIn: t('playing_in_seconds', {
                    defaultValue: 'Playing in {n}…',
                  }),
                  cancel: t('cancel', { defaultValue: 'Cancel' }),
                  suggested: t('suggested_for_you'),
                  replay: t('replay', { defaultValue: 'Replay' }),
                }}
                onPlayNext={() => {
                  if (nextVideo) goToVideo(nextVideo.id, nextVideo.contentType);
                }}
                onCancelAutoplay={clearCountdown}
                onSelectVideo={(id) => {
                  const picked =
                    shelfVideos.find((v) => v.id === id) ??
                    suggestedVideos.find((v) => v.id === id);
                  goToVideo(id, picked?.contentType);
                }}
                onReplay={replayVideo}
              />
            ) : null
          }
        />
      </View>
    );
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: useShortLayout ? '#000' : colors.background },
        useShortLayout && !immersiveFullscreen && styles.screenShort,
      ]}
    >
      {!immersiveFullscreen ? (
        <LinearGradient
          colors={
            useShortLayout
              ? ['#000', '#000', '#000']
              : [colors.background, colors.backgroundSecondary, colors.background]
          }
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      ) : null}

      {!immersiveFullscreen ? (
        <View style={[styles.header, { paddingTop: insets.top }, useShortLayout && styles.headerShort]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[
              styles.headerBack,
              {
                backgroundColor: useShortLayout
                  ? 'rgba(255,255,255,0.18)'
                  : colors.surface,
              },
            ]}
          >
            <Icon
              name="chevron-back"
              size={24}
              color={useShortLayout ? '#fff' : colors.text}
            />
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          immersiveFullscreen ? styles.playerWrapImmersive : styles.playerWrap,
          !immersiveFullscreen && { height: isShort ? SHORT_HEIGHT + 8 : videoHeight + 8 },
        ]}
      >
        {renderPlayer()}
      </View>

      {!immersiveFullscreen ? (
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
        >
          <VideoDetailPanel
            title={video.title}
            channelName={video.channelName}
            channelThumbnailUrl={video.channelThumbnailUrl}
            channelNavigable={channelNavigable}
            showActions={role === 'child'}
            isFavorite={isVideoFavorite(video.id)}
            isChannelFavorite={video.channelId ? isChannelFavorite(video.channelId) : false}
            hasChannel={Boolean(video.channelId)}
            nextVideo={nextVideo}
            showUpNext={Boolean(role === 'child' && nextVideo && !playbackEnded)}
            suggestedVideos={role === 'child' ? suggestedVideos : []}
            labels={{
              favorites: t('favorites'),
              channels: t('favorite_channels'),
              visitChannel: t('visit_channel'),
              upNext: t('up_next'),
              suggested: t('suggested_for_you'),
            }}
            onOpenChannel={openChannel}
            onToggleFavorite={() => void toggleVideo(video.id)}
            onToggleChannel={() => video.channelId && void toggleChannel(video.channelId)}
            onUpNext={() => nextVideo && goToVideo(nextVideo.id, nextVideo.contentType)}
            onVideo={(id) => {
              const picked =
                suggestedVideos.find((v) => v.id === id) ?? (nextVideo?.id === id ? nextVideo : null);
              goToVideo(id, picked?.contentType);
            }}
            onFavoriteVideo={(id) =>
              role === 'child' ? void toggleVideo(id) : toggleFavorite(id)
            }
          />
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenShort: { backgroundColor: '#000' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errText: { color: '#4A3278', textAlign: 'center', paddingHorizontal: 24 },
  backLink: { color: BRAND_PRIMARY, fontWeight: '700', fontSize: 15 },
  header: {
    paddingHorizontal: 14,
    paddingBottom: 2,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F0A1F',
  },
  previewMeta: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  previewError: {
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  playerWrap: {
    justifyContent: 'center',
    marginHorizontal: 12,
    marginBottom: 4,
  },
  playerWrapImmersive: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    backgroundColor: '#000',
    marginHorizontal: 0,
    marginBottom: 0,
  },
  playerFrame: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#0F0A1F',
    shadowColor: '#7B4DFF',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  playerFrameImmersive: {
    borderRadius: playerTheme.radiusImmersive,
    shadowOpacity: 0,
    elevation: 0,
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  videoUntilReady: {
    opacity: 0,
  },
  videoShortParent: {
    width: Math.min(width * 0.72, 320),
    height: Math.min(width * 0.72, 320) * (16 / 9),
    alignSelf: 'center',
  },
  headerShort: { backgroundColor: 'transparent' },
  ytOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scroll: { flex: 1 },
});
