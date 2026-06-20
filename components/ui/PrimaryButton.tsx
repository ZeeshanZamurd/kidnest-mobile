import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { radius, typography } from '../../theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: ViewStyle;
  disabled?: boolean;
};

export default function PrimaryButton({
  label,
  onPress,
  loading,
  variant = 'primary',
  style,
  disabled,
}: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  if (variant === 'outline') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          animatedStyle,
          styles.outline,
          { borderColor: colors.primary },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
        )}
      </AnimatedPressable>
    );
  }

  if (variant === 'ghost') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[animatedStyle, styles.ghost, style]}
      >
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, styles.button, style]}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.labelWhite}>{label}</Text>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  ghost: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  label: {
    ...typography.bodyBold,
  },
  labelWhite: {
    ...typography.bodyBold,
    color: '#fff',
  },
});
