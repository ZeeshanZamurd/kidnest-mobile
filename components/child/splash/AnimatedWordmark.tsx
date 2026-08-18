import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  BRAND_CHILD_ACCENT,
  BRAND_PRIMARY,
  SPLASH_TITLE_KIDO,
  SPLASH_TITLE_NEST,
} from '../../../constants/branding';

export default function AnimatedWordmark() {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(28);

  useEffect(() => {
    opacity.value = withDelay(
      520,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      520,
      withSpring(0, { damping: 11, stiffness: 120 }),
    );
  }, [opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, style]}>
      <Text style={styles.title} accessibilityLabel="KidoNest">
        <Text style={styles.kido}>{SPLASH_TITLE_KIDO}</Text>
        <Text style={styles.nest}>{SPLASH_TITLE_NEST}</Text>
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  kido: {
    color: BRAND_PRIMARY,
  },
  nest: {
    color: BRAND_CHILD_ACCENT,
  },
});
