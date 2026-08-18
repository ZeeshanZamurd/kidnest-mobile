import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BRAND_CHILD_ACCENT, BRAND_CYAN } from '../../../constants/branding';

type Particle = {
  id: number;
  left: number;
  top: number;
  size: number;
  kind: 'star' | 'cloud';
  color: string;
  delay: number;
};

function FloatingParticle({ particle }: { particle: Particle }) {
  const drift = useSharedValue(0);
  const opacity = useSharedValue(0.35);

  React.useEffect(() => {
    drift.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(-14, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(14, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    opacity.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(0.95, { duration: 1400 }),
          withTiming(0.35, { duration: 1400 }),
        ),
        -1,
        true,
      ),
    );
  }, [drift, opacity, particle.delay]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: drift.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        particle.kind === 'cloud' ? styles.cloud : styles.star,
        {
          left: `${particle.left}%`,
          top: `${particle.top}%`,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          shadowColor: particle.color,
        },
        style,
      ]}
    />
  );
}

export default function SplashParticles() {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 14 }, (_, id) => ({
        id,
        left: 8 + ((id * 17) % 84),
        top: 6 + ((id * 23) % 78),
        size: id % 3 === 0 ? 18 : id % 2 === 0 ? 12 : 8,
        kind: id % 4 === 0 ? 'cloud' : 'star',
        color: id % 2 === 0 ? BRAND_CHILD_ACCENT : BRAND_CYAN,
        delay: id * 120,
      })),
    [],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle) => (
        <FloatingParticle key={particle.id} particle={particle} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
  star: {
    borderRadius: 999,
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  cloud: {
    borderRadius: 999,
    opacity: 0.7,
  },
});
