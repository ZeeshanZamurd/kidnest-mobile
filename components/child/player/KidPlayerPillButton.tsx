import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  icon: string;
  onPress: () => void;
  colors: [string, string];
  glowColor: string;
  size?: number;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function KidPlayerPillButton({
  icon,
  onPress,
  colors,
  glowColor,
  size = 52,
  accessibilityLabel,
  disabled = false,
  style,
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.92, { damping: 14, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 240 });
      }}
      style={[animatedStyle, style, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.pill,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            shadowColor: glowColor,
          },
        ]}
      >
        <Icon name={icon} size={size * 0.42} color="#fff" />
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  disabled: {
    opacity: 0.35,
  },
});
