import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
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

const AnimatedView = Animated.View;

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  loadingLabel?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: ViewStyle;
  disabled?: boolean;
};

export default function PrimaryButton({
  label,
  onPress,
  loading,
  loadingLabel,
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
      <AnimatedView style={[animatedStyle, style]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={[styles.outline, { borderColor: colors.primary }]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
          )}
        </Pressable>
      </AnimatedView>
    );
  }

  if (variant === 'ghost') {
    return (
      <AnimatedView style={[animatedStyle, style]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={styles.ghost}
        >
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        </Pressable>
      </AnimatedView>
    );
  }

  return (
    <AnimatedView style={[animatedStyle, styles.wrapper, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={styles.button}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.labelWhite}>{loadingLabel ?? label}</Text>
            </View>
          ) : (
            <Text style={styles.labelWhite}>{label}</Text>
          )}
        </View>
      </Pressable>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
  },
  button: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  content: {
    minHeight: 52,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
