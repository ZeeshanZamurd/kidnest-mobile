import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  BRAND_CHILD_ACCENT,
  BRAND_CYAN,
  BRAND_PRIMARY,
} from '../../../constants/branding';

const TRACK_HEIGHT = 14;
const STAR_SIZE = 36;
const HIT_HEIGHT = 52;

type Props = {
  progress: number;
  buffered: number;
  duration: number;
  onSeek: (time: number) => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
  compact?: boolean;
};

export default function KidStarSeekBar({
  progress,
  buffered,
  duration,
  onSeek,
  onSeekStart,
  onSeekEnd,
  compact = false,
}: Props) {
  const trackWidth = useRef(0);
  const trackWidthShared = useSharedValue(0);
  const progressShared = useSharedValue(0);
  const bufferedShared = useSharedValue(0);
  const starScale = useSharedValue(1);
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
          starScale.value = withSpring(1.18, { damping: 10, stiffness: 260 });
          onSeekStart();
          seekAtX(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          seekAtX(evt.nativeEvent.locationX);
        },
        onPanResponderRelease: () => {
          scrubbingRef.current = false;
          starScale.value = withSpring(1, { damping: 12, stiffness: 200 });
          onSeekEnd();
        },
        onPanResponderTerminate: () => {
          scrubbingRef.current = false;
          starScale.value = withSpring(1);
          onSeekEnd();
        },
      }),
    [onSeekEnd, onSeekStart, seekAtX, starScale],
  );

  const bufferStyle = useAnimatedStyle(() => ({
    width: trackWidthShared.value * bufferedShared.value,
  }));

  const fillClipStyle = useAnimatedStyle(() => ({
    width: Math.max(0, trackWidthShared.value * progressShared.value),
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: trackWidthShared.value * progressShared.value - STAR_SIZE / 2 },
      { scale: starScale.value },
    ],
  }));

  const trackH = compact ? 8 : TRACK_HEIGHT;
  const starSz = compact ? 22 : STAR_SIZE;

  return (
    <View
      style={styles.hitArea}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        trackWidth.current = w;
        trackWidthShared.value = w;
      }}
      {...panResponder.panHandlers}
    >
      <View style={[styles.track, { height: trackH, borderRadius: trackH / 2 }]}>
        <Animated.View style={[styles.buffer, bufferStyle, { borderRadius: trackH / 2 }]} />
        <Animated.View style={[styles.fillClip, fillClipStyle]}>
          <LinearGradient
            colors={[BRAND_PRIMARY, '#9B6BFF', BRAND_CYAN]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.fillGradient, { width: trackWidth.current || 1, height: trackH }]}
          />
        </Animated.View>
      </View>
      {!compact ? (
        <Animated.View style={[styles.starWrap, starStyle, { top: (HIT_HEIGHT - starSz) / 2 - 2 }]}>
          <LinearGradient
            colors={['#FFF4A3', BRAND_CHILD_ACCENT, '#F5A623']}
            style={[styles.starBody, { width: starSz, height: starSz, borderRadius: starSz / 2 }]}
          >
            <Icon name="star" size={starSz * 0.55} color="#fff" />
          </LinearGradient>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    width: '100%',
    height: HIT_HEIGHT,
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    backgroundColor: 'rgba(232, 222, 255, 0.55)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(123, 77, 255, 0.2)',
  },
  buffer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(123, 77, 255, 0.25)',
  },
  fillClip: {
    height: '100%',
    overflow: 'hidden',
  },
  fillGradient: {
    flex: 1,
  },
  starWrap: {
    position: 'absolute',
    left: 0,
    shadowColor: BRAND_CHILD_ACCENT,
    shadowOpacity: 0.65,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  starBody: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
});
