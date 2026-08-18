import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AnimatedPressable from './AnimatedPressable';
import ProgressBar from './ProgressBar';
import { formatTime } from './formatTime';
import { playerTheme } from './playerTheme';

const T = playerTheme;

type Props = {
  paused: boolean;
  progress: number;
  buffered: number;
  duration: number;
  currentTime: number;
  immersiveFullscreen: boolean;
  isShort: boolean;
  showPrev: boolean;
  showNext: boolean;
  onPlayPause: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onFullscreen: () => void;
  onSeek: (time: number) => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
};

export default function VideoControlsDock({
  paused,
  progress,
  buffered,
  duration,
  currentTime,
  immersiveFullscreen,
  isShort,
  showPrev,
  showNext,
  onPlayPause,
  onPrev,
  onNext,
  onFullscreen,
  onSeek,
  onSeekStart,
  onSeekEnd,
}: Props) {
  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={[...T.overlay.gradient]}
        locations={[...T.overlay.gradientLocations]}
        style={styles.fade}
        pointerEvents="none"
      />

      <View style={styles.glass}>
        {Platform.OS === 'ios' ? (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={18}
            reducedTransparencyFallbackColor="rgba(18,12,38,0.82)"
          />
        ) : (
          <View style={styles.glassAndroid} />
        )}

        <View style={styles.inner}>
          <ProgressBar
            progress={progress}
            buffered={buffered}
            duration={duration}
            onSeek={onSeek}
            onSeekStart={onSeekStart}
            onSeekEnd={onSeekEnd}
          />

          <View style={styles.controlsRow}>
            <View style={styles.leftCluster}>
              {showPrev ? (
                <AnimatedPressable
                  style={styles.iconBtn}
                  onPress={onPrev}
                  accessibilityLabel="Previous"
                >
                  <Icon name="play-skip-back" size={18} color="#fff" />
                </AnimatedPressable>
              ) : null}

              <AnimatedPressable
                style={styles.playBtn}
                onPress={onPlayPause}
                accessibilityLabel={paused ? 'Play' : 'Pause'}
              >
                <LinearGradient colors={[...T.play.gradient]} style={styles.playGradient}>
                  <Icon name={paused ? 'play' : 'pause'} size={22} color="#fff" />
                </LinearGradient>
              </AnimatedPressable>

              {showNext ? (
                <AnimatedPressable
                  style={styles.iconBtn}
                  onPress={onNext}
                  accessibilityLabel="Next"
                >
                  <Icon name="play-skip-forward" size={18} color="#fff" />
                </AnimatedPressable>
              ) : null}

              <View style={styles.timePill}>
                <Text style={styles.timeText} numberOfLines={1}>
                  {formatTime(currentTime)}
                </Text>
                <Text style={styles.timeSep}> / </Text>
                <Text style={styles.timeTextDim} numberOfLines={1}>
                  {formatTime(duration)}
                </Text>
              </View>
            </View>

            {!isShort ? (
              <AnimatedPressable
                style={styles.iconBtn}
                onPress={onFullscreen}
                accessibilityLabel={immersiveFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                <Icon name={immersiveFullscreen ? 'contract' : 'expand'} size={18} color="#fff" />
              </AnimatedPressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    height: T.overlay.fadeHeight,
  },
  glass: {
    width: '100%',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  glassAndroid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,12,38,0.82)',
  },
  inner: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  leftCluster: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  playBtn: {
    width: T.play.dockSize,
    height: T.play.dockSize,
    borderRadius: T.play.dockSize / 2,
    overflow: 'hidden',
    flexShrink: 0,
  },
  playGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: T.fullscreen.size,
    height: T.fullscreen.size,
    borderRadius: 12,
    backgroundColor: T.fullscreen.bg,
    borderWidth: 1,
    borderColor: T.fullscreen.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    paddingHorizontal: 2,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  timeSep: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 0,
  },
  timeTextDim: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
});
