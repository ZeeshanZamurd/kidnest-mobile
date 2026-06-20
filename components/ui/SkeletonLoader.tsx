import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/colors';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export default function SkeletonLoader({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  style,
}: Props) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[{ width, height, borderRadius, overflow: 'hidden' }, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.border },
          animatedStyle,
        ]}
      />
    </View>
  );
}

export function VideoCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[skeletonStyles.card, { backgroundColor: colors.card }]}>
      <SkeletonLoader height={180} borderRadius={radius.lg} />
      <SkeletonLoader height={14} width="80%" style={{ marginTop: 12 }} />
      <SkeletonLoader height={12} width="50%" style={{ marginTop: 8 }} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 16,
  },
});
