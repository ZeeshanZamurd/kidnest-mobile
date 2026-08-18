import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { playerTheme } from './playerTheme';

const T = playerTheme.buffering;

function BounceDot({ delay }: { delay: number }) {
  const y = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      y.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 320 }),
          withTiming(0, { duration: 320 }),
        ),
        -1,
        false,
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export default function PlayerBufferingOverlay() {
  const ringScale = useSharedValue(0.92);
  const ringOpacity = useSharedValue(0.55);
  const coreScale = useSharedValue(1);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900, easing: Easing.out(Easing.cubic) }),
        withTiming(0.92, { duration: 900, easing: Easing.in(Easing.cubic) }),
      ),
      -1,
      false,
    );
    ringOpacity.value = withRepeat(
      withSequence(withTiming(0.15, { duration: 900 }), withTiming(0.55, { duration: 900 })),
      -1,
      false,
    );
    coreScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    shimmer.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.linear }), -1, false);
  }, [coreScale, ringOpacity, ringScale, shimmer]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coreScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + shimmer.value * 0.35,
    transform: [{ translateX: -80 + shimmer.value * 160 }],
  }));

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.shimmer, shimmerStyle]} />
      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View style={[styles.core, coreStyle]}>
        <LinearGradient colors={[...T.coreGradient]} style={styles.coreGradient}>
          <Icon name="play" size={28} color="#fff" style={{ marginLeft: 3 }} />
        </LinearGradient>
      </Animated.View>
      <View style={styles.dots}>
        <BounceDot delay={0} />
        <BounceDot delay={120} />
        <BounceDot delay={240} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.scrim,
    zIndex: 4,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ skewX: '-18deg' }],
  },
  ring: {
    position: 'absolute',
    width: T.ringSize,
    height: T.ringSize,
    borderRadius: T.ringSize / 2,
    borderWidth: 4,
    borderColor: 'rgba(155, 107, 255, 0.85)',
    backgroundColor: 'transparent',
  },
  core: {
    width: T.coreSize,
    height: T.coreSize,
    borderRadius: T.coreSize / 2,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.92)',
    shadowColor: T.shadow,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  coreGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: '28%',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});
