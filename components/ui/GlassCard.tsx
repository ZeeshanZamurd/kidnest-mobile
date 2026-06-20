import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing } from '../../theme/colors';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
};

export default function GlassCard({ children, style, intensity = 24 }: Props) {
  const { colors, isDark } = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.wrapper, { borderColor: colors.border }, style]}>
        <BlurView
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={intensity}
          style={StyleSheet.absoluteFill}
          reducedTransparencyFallbackColor={colors.surfaceGlass}
        />
        <View style={styles.inner}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        styles.androidGlass,
        { backgroundColor: colors.surfaceGlass, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inner: {
    padding: spacing.md,
  },
  androidGlass: {
    padding: spacing.md,
  },
});
