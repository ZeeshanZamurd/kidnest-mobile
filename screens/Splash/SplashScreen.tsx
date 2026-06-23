import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import AppLogo from '../../components/brand/AppLogo';
import { BRAND_GRADIENT } from '../../constants/branding';

type Props = {
  authReady: boolean;
  onFinish: () => void;
};

const MIN_VISIBLE_MS = 700;

export default function SplashScreen({ authReady, onFinish }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.88);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [opacity, scale]);

  useEffect(() => {
    if (!authReady) return;
    const timer = setTimeout(onFinish, MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [authReady, onFinish]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <AppLogo size={168} shadow={false} />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
});
