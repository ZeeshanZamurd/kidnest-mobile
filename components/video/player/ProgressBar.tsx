import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { formatTime } from './formatTime';
import { playerTheme } from './playerTheme';

const T = playerTheme.progress;

type Props = {
  progress: number;
  buffered: number;
  duration: number;
  onSeek: (time: number) => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
};

export default function ProgressBar({
  progress,
  buffered,
  duration,
  onSeek,
  onSeekStart,
  onSeekEnd,
}: Props) {
  const trackWidth = useRef(0);
  const [trackWidthPx, setTrackWidthPx] = useState(0);
  const trackWidthShared = useSharedValue(0);
  const progressShared = useSharedValue(0);
  const bufferedShared = useSharedValue(0);
  const trackHeight = useSharedValue(T.trackH);
  const thumbScale = useSharedValue(1);
  const thumbOpacity = useSharedValue(0.85);
  const glowOpacity = useSharedValue(0);
  const scrubbingRef = useRef(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);

  useEffect(() => {
    if (scrubbingRef.current) return;
    progressShared.value = withSpring(progress, { damping: 24, stiffness: 220 });
  }, [progress, progressShared]);

  useEffect(() => {
    bufferedShared.value = withTiming(buffered, { duration: 280 });
  }, [buffered, bufferedShared]);

  const seekAtX = useCallback(
    (x: number) => {
      if (duration <= 0 || trackWidth.current <= 0) return;
      const ratio = Math.max(0, Math.min(1, x / trackWidth.current));
      progressShared.value = ratio;
      const t = ratio * duration;
      setScrubTime(t);
      onSeek(t);
    },
    [duration, onSeek, progressShared],
  );

  const beginScrub = useCallback(() => {
    scrubbingRef.current = true;
    setScrubbing(true);
    trackHeight.value = withSpring(T.trackActiveH, { damping: 18, stiffness: 320 });
    thumbScale.value = withSpring(T.thumbActive / T.thumb, { damping: 14, stiffness: 320 });
    thumbOpacity.value = withTiming(1, { duration: 100 });
    glowOpacity.value = withTiming(1, { duration: 120 });
    onSeekStart();
  }, [glowOpacity, onSeekStart, thumbOpacity, thumbScale, trackHeight]);

  const endScrub = useCallback(() => {
    scrubbingRef.current = false;
    setScrubbing(false);
    trackHeight.value = withSpring(T.trackH, { damping: 20, stiffness: 280 });
    thumbScale.value = withSpring(1, { damping: 16, stiffness: 300 });
    thumbOpacity.value = withTiming(0.85, { duration: 160 });
    glowOpacity.value = withTiming(0, { duration: 180 });
    onSeekEnd();
  }, [glowOpacity, onSeekEnd, thumbOpacity, thumbScale, trackHeight]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          beginScrub();
          seekAtX(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => seekAtX(evt.nativeEvent.locationX),
        onPanResponderRelease: endScrub,
        onPanResponderTerminate: endScrub,
      }),
    [beginScrub, endScrub, seekAtX],
  );

  const trackStyle = useAnimatedStyle(() => ({
    height: trackHeight.value,
    borderRadius: trackHeight.value / 2,
  }));

  const bufferStyle = useAnimatedStyle(() => ({
    width: trackWidthShared.value * bufferedShared.value,
    borderRadius: trackHeight.value / 2,
  }));

  const fillClipStyle = useAnimatedStyle(() => ({
    width: trackWidthShared.value * progressShared.value,
    borderRadius: trackHeight.value / 2,
  }));

  const thumbStyle = useAnimatedStyle(() => {
    const thumbSize = T.thumb * thumbScale.value;
    const x = trackWidthShared.value * progressShared.value;
    const clamped = Math.max(thumbSize / 2, Math.min(trackWidthShared.value - thumbSize / 2, x));
    return {
      opacity: thumbOpacity.value,
      transform: [{ translateX: clamped - thumbSize / 2 }, { scale: thumbScale.value }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const size = T.thumbActive;
    const x = trackWidthShared.value * progressShared.value;
    const clamped = Math.max(size / 2, Math.min(trackWidthShared.value - size / 2, x));
    return {
      opacity: glowOpacity.value * 0.7,
      transform: [{ translateX: clamped - size }, { scale: thumbScale.value }],
    };
  });

  const tooltipStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: Math.max(
          4,
          Math.min(
            trackWidthShared.value - 52,
            trackWidthShared.value * progressShared.value - 26,
          ),
        ),
      },
    ],
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.wrap}>
      <View
        style={styles.hit}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          trackWidth.current = w;
          trackWidthShared.value = w;
          setTrackWidthPx(w);
        }}
        {...panResponder.panHandlers}
      >
        {scrubbing ? (
          <Animated.View style={[styles.tooltip, tooltipStyle]} pointerEvents="none">
            <Text style={styles.tooltipText}>{formatTime(scrubTime)}</Text>
          </Animated.View>
        ) : null}

        <Animated.View style={[styles.track, trackStyle]}>
          <View style={styles.rail} />
          <Animated.View style={[styles.buffer, bufferStyle]} />
          <Animated.View style={[styles.fillClip, fillClipStyle]}>
            <LinearGradient
              colors={[...T.fillGradient]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.fillGradient, { width: Math.max(trackWidthPx, 1) }]}
            />
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.thumbGlow, glowStyle]} pointerEvents="none" />
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  hit: {
    height: T.hitH,
    justifyContent: 'center',
  },
  track: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  rail: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: T.trackBg,
    borderRadius: 999,
  },
  buffer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: T.bufferBg,
  },
  fillClip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  fillGradient: {
    height: '100%',
  },
  thumbGlow: {
    position: 'absolute',
    top: T.hitH / 2 - T.thumbActive,
    width: T.thumbActive * 2,
    height: T.thumbActive * 2,
    borderRadius: T.thumbActive,
    backgroundColor: T.glow,
  },
  thumb: {
    position: 'absolute',
    top: T.hitH / 2 - T.thumb / 2,
    width: T.thumb,
    height: T.thumb,
    borderRadius: T.thumb / 2,
    backgroundColor: T.thumbColor,
    borderWidth: 2,
    borderColor: T.thumbBorder,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  tooltip: {
    position: 'absolute',
    top: -28,
    minWidth: 52,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tooltipText: {
    color: '#3B2D63',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
