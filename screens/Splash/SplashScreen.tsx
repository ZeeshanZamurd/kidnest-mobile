import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import AnimatedShieldLogo from '../../components/child/splash/AnimatedShieldLogo';
import AnimatedWordmark from '../../components/child/splash/AnimatedWordmark';
import SplashParticles from '../../components/child/splash/SplashParticles';
import { BRAND_PRIMARY } from '../../constants/branding';
import { hideNativeSplash } from '../../services/nativeSplash';

const SPLASH_DURATION_MS = 2500;
const FADE_OUT_MS = 450;

type Props = {
  /** App bootstrap (auth/storage) finished — splash won't dismiss before this. */
  authReady?: boolean;
  onFinish?: () => void;
};

/** Premium app startup splash — shield, particles, wordmark, then fade to app. */
export default function SplashScreen({ authReady = false, onFinish }: Props) {
  const screenOpacity = useSharedValue(1);
  const startedAt = useRef(Date.now());
  const finishing = useRef(false);

  useLayoutEffect(() => {
    hideNativeSplash();
  }, []);

  const finish = () => {
    if (finishing.current || !onFinish) return;
    finishing.current = true;
    onFinish();
  };

  useEffect(() => {
    if (!authReady) return;

    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, SPLASH_DURATION_MS - elapsed);

    const timer = setTimeout(() => {
      screenOpacity.value = withTiming(
        0,
        { duration: FADE_OUT_MS, easing: Easing.inOut(Easing.cubic) },
        (done) => {
          if (done) {
            runOnJS(finish)();
          }
        },
      );
    }, remaining);

    return () => clearTimeout(timer);
  }, [authReady, onFinish, screenOpacity]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.root, fadeStyle]}>
      <LinearGradient
        colors={['#F3EEFF', '#E8DEFF', BRAND_PRIMARY]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SplashParticles />
      <View style={styles.center}>
        <AnimatedShieldLogo />
        <AnimatedWordmark />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
});
