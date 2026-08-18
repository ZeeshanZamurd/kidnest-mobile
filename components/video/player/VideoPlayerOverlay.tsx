import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import type { VideoStream } from '../../../api/browse';
import VideoControlsDock from './VideoControlsDock';
import PlayerBufferingOverlay from './PlayerBufferingOverlay';
import PlayerVideoShelf from './PlayerVideoShelf';
import { playerTheme } from './playerTheme';
import type { Video } from '../../../types';

const T = playerTheme;

type Props = {
  paused: boolean;
  controlsVisible: boolean;
  hasDisplayedFrame: boolean;
  isBuffering: boolean;
  switchingVideo: boolean;
  immersiveFullscreen: boolean;
  isShort: boolean;
  duration: number;
  currentTime: number;
  progress: number;
  buffered: number;
  showPrev: boolean;
  showNext: boolean;
  insetsTop: number;
  insetsLeft: number;
  insetsBottom: number;
  availableStreams: VideoStream[];
  activeStreamLabel: string;
  selectedQuality: string | null;
  qualityMenuVisible: boolean;
  onTogglePlay: () => void;
  onPlay: () => void;
  onRevealControls: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onFullscreen: () => void;
  onExitFullscreen: () => void;
  onSeek: (time: number) => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
  onToggleQualityMenu: () => void;
  onSelectQuality: (quality: string) => void;
  showVideoShelf: boolean;
  shelfVisible: boolean;
  shelfVideos: Video[];
  currentVideoId: string;
  shelfTitle: string;
  onToggleShelf: () => void;
  onSelectShelfVideo: (videoId: string) => void;
  hasPosterLoader: boolean;
};

export default function VideoPlayerOverlay({
  paused,
  controlsVisible,
  hasDisplayedFrame,
  isBuffering,
  switchingVideo,
  immersiveFullscreen,
  isShort,
  duration,
  currentTime,
  progress,
  buffered,
  showPrev,
  showNext,
  insetsTop,
  insetsLeft,
  insetsBottom,
  availableStreams,
  activeStreamLabel,
  selectedQuality,
  qualityMenuVisible,
  onTogglePlay,
  onPlay,
  onRevealControls,
  onPrev,
  onNext,
  onFullscreen,
  onExitFullscreen,
  onSeek,
  onSeekStart,
  onSeekEnd,
  onToggleQualityMenu,
  onSelectQuality,
  showVideoShelf,
  shelfVisible,
  shelfVideos,
  currentVideoId,
  shelfTitle,
  onToggleShelf,
  onSelectShelfVideo,
  hasPosterLoader,
}: Props) {
  const controlsOpacity = useSharedValue(1);
  const centerScale = useSharedValue(0.9);
  const centerOpacity = useSharedValue(0);

  useEffect(() => {
    controlsOpacity.value = withTiming(controlsVisible ? 1 : 0, { duration: 220 });
  }, [controlsVisible, controlsOpacity]);

  useEffect(() => {
    const showCenter = paused && hasDisplayedFrame && !isBuffering && !controlsVisible;
    centerOpacity.value = withTiming(showCenter ? 1 : 0, { duration: 200 });
    centerScale.value = withSpring(showCenter ? 1 : 0.88, { damping: 14, stiffness: 260 });
  }, [paused, hasDisplayedFrame, isBuffering, controlsVisible, centerOpacity, centerScale]);

  const controlsStyle = useAnimatedStyle(() => ({ opacity: controlsOpacity.value }));
  const centerStyle = useAnimatedStyle(() => ({
    opacity: centerOpacity.value,
    transform: [{ scale: centerScale.value }],
  }));

  const dockHeight =
    duration > 0 ? (controlsVisible ? T.dockHeight + 14 : T.miniBarHeight) : 0;
  const qualityHeight = controlsVisible && availableStreams.length > 1 ? T.qualityRowHeight : 0;
  const shelfInOverlay = showVideoShelf && immersiveFullscreen;
  const shelfHeight =
    shelfInOverlay && shelfVisible && shelfVideos.length > 0
      ? T.shelfHeight + insetsBottom
      : 0;
  const chromeBottom = dockHeight + qualityHeight + shelfHeight;

  const handleVideoTap = () => {
    if (shelfInOverlay && shelfVideos.length > 0) {
      if (!controlsVisible) {
        onRevealControls();
        if (!shelfVisible) onToggleShelf();
        return;
      }
      onToggleShelf();
      return;
    }
    if (controlsVisible) onTogglePlay();
    else onRevealControls();
  };

  return (
    <>
      {(switchingVideo || (isBuffering && !hasDisplayedFrame)) && !hasPosterLoader ? (
        <PlayerBufferingOverlay />
      ) : null}

      <Animated.View style={[styles.centerPlay, centerStyle]} pointerEvents="box-none">
        <Pressable onPress={onPlay} accessibilityLabel="Play">
          <LinearGradient colors={[...T.play.gradient]} style={styles.centerPlayBtn}>
            <Icon name="play" size={38} color="#fff" style={{ marginLeft: 4 }} />
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <Pressable
        style={[styles.tapZone, { bottom: chromeBottom }]}
        onPress={handleVideoTap}
      />

      {shelfInOverlay && shelfVisible && shelfVideos.length > 0 ? (
        <View
          style={[
            styles.shelfLayer,
            { bottom: dockHeight + qualityHeight, paddingBottom: insetsBottom },
          ]}
          pointerEvents="box-none"
        >
          <PlayerVideoShelf
            title={shelfTitle}
            videos={shelfVideos}
            currentVideoId={currentVideoId}
            onSelectVideo={onSelectShelfVideo}
            variant="overlay"
          />
        </View>
      ) : null}

      {duration > 0 && controlsVisible ? (
        <View style={styles.dockLayer} pointerEvents="box-none">
          <VideoControlsDock
            paused={paused}
            progress={progress}
            buffered={buffered}
            duration={duration}
            currentTime={currentTime}
            immersiveFullscreen={immersiveFullscreen}
            isShort={isShort}
            showPrev={showPrev}
            showNext={showNext}
            onPlayPause={onTogglePlay}
            onPrev={onPrev}
            onNext={onNext}
            onFullscreen={onFullscreen}
            onSeek={onSeek}
            onSeekStart={onSeekStart}
            onSeekEnd={onSeekEnd}
          />
        </View>
      ) : null}

      {duration > 0 && !controlsVisible ? (
        <View style={styles.miniLayer} pointerEvents="none">
          <View style={styles.miniTrack}>
            <View style={[styles.miniBuffer, { width: `${buffered * 100}%` }]} />
            <LinearGradient
              colors={[...T.progress.fillGradient]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.miniFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>
      ) : null}

      <Animated.View
        style={[styles.qualityLayer, controlsStyle, duration > 0 && { bottom: dockHeight }]}
        pointerEvents={controlsVisible ? 'box-none' : 'none'}
      >
        {immersiveFullscreen ? (
          <Pressable
            style={[styles.backBtn, { top: Math.max(insetsTop, 10), left: Math.max(insetsLeft, 10) }]}
            onPress={onExitFullscreen}
          >
            <Icon name="chevron-back" size={24} color="#fff" />
          </Pressable>
        ) : null}

        {controlsVisible && availableStreams.length > 1 ? (
          <View style={styles.qualityRow}>
            <Pressable style={styles.qualityBtn} onPress={onToggleQualityMenu}>
              <Icon name="options-outline" size={15} color="#fff" />
              <Text style={styles.qualityBtnText}>{activeStreamLabel}</Text>
              <Icon
                name={qualityMenuVisible ? 'chevron-down' : 'chevron-up'}
                size={14}
                color="rgba(255,255,255,0.85)"
              />
            </Pressable>
            {qualityMenuVisible ? (
              <View style={styles.qualityMenu}>
                {availableStreams.map((stream) => {
                  const selected = selectedQuality === stream.quality;
                  return (
                    <Pressable
                      key={stream.quality}
                      style={[styles.qualityOption, selected && styles.qualityOptionActive]}
                      onPress={() => onSelectQuality(stream.quality)}
                    >
                      <Text
                        style={[styles.qualityOptionText, selected && styles.qualityOptionTextActive]}
                      >
                        {stream.label}
                      </Text>
                      {selected ? <Icon name="checkmark" size={16} color="#fff" /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  centerPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  centerPlayBtn: {
    width: T.play.centerSize,
    height: T.play.centerSize,
    borderRadius: T.play.centerSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: T.play.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  tapZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  dockLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 8,
  },
  shelfLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 7,
  },
  miniLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 8,
  },
  miniTrack: {
    height: T.miniBarHeight,
    backgroundColor: T.miniBar.track,
    overflow: 'hidden',
  },
  miniBuffer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  miniFill: {
    height: '100%',
  },
  qualityLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 7,
    justifyContent: 'flex-end',
  },
  backBtn: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9,
  },
  qualityRow: {
    paddingHorizontal: 14,
    paddingBottom: 6,
    alignItems: 'flex-end',
  },
  qualityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  qualityBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  qualityMenu: {
    marginTop: 8,
    minWidth: 140,
    borderRadius: 14,
    backgroundColor: 'rgba(22,18,42,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  qualityOptionActive: {
    backgroundColor: 'rgba(123,77,255,0.22)',
  },
  qualityOptionText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '600',
  },
  qualityOptionTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
