import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BRAND_ACCENT, BRAND_CYAN, BRAND_PRIMARY } from '../../constants/branding';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'child' | 'subtle';
};

export default function GradientBackground({ children, style, variant = 'default' }: Props) {
  const { colors } = useTheme();

  const gradientColors =
    variant === 'child'
      ? [BRAND_ACCENT, BRAND_PRIMARY, BRAND_CYAN]
      : variant === 'subtle'
        ? [colors.background, colors.backgroundSecondary, colors.background]
        : [colors.gradientStart, colors.gradientMid, colors.gradientEnd];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  content: { flex: 1 },
});
