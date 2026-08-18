import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import AppLogo from '../../brand/AppLogo';
import { LOGO_SIZES } from '../../../constants/branding';

export default function AnimatedShieldLogo() {
  const scale = useSharedValue(0.4);
  const rotate = useSharedValue(-8);
  const glow = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.08, { damping: 9, stiffness: 120 }),
      withSpring(1, { damping: 12, stiffness: 160 }),
    );
    rotate.value = withSequence(
      withTiming(4, { duration: 280, easing: Easing.out(Easing.cubic) }),
      withSpring(0, { damping: 10, stiffness: 140 }),
    );
    glow.value = withDelay(
      200,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, [glow, rotate, scale]);

  const shieldStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.9 + glow.value * 0.25 }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={[styles.shield, shieldStyle]}>
        <AppLogo size={LOGO_SIZES.splash} shadow={false} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: LOGO_SIZES.splash + 72,
    height: LOGO_SIZES.splash + 72,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  shield: {
    shadowColor: '#FFD93D',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
});
