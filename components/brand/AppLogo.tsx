import React from 'react';
import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';
import { BRAND_ASSETS, BRAND_PRIMARY } from '../../constants/branding';

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
  /** Soft brand shadow — off on gradient/splash screens. */
  shadow?: boolean;
};

/** Official KidNest app icon for in-app branding. */
export default function AppLogo({ size = 120, style, shadow = true }: Props) {
  return (
    <Image
      source={BRAND_ASSETS.appLogo}
      style={[shadow ? styles.logoShadow : null, { width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityLabel="KidNest"
    />
  );
}

const styles = StyleSheet.create({
  logoShadow: {
    shadowColor: BRAND_PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
});
