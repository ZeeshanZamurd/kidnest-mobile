import React from 'react';
import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

const APP_ICON = require('../../assets/branding/app-icon-splash.png');

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
  /** Drop shadow — off on splash/gradient screens to avoid a dark halo. */
  shadow?: boolean;
};

/** Official KidNest app icon for in-app branding. */
export default function AppLogo({ size = 120, style, shadow = true }: Props) {
  return (
    <Image
      source={APP_ICON}
      style={[
        shadow ? styles.logoShadow : null,
        { width: size, height: size, borderRadius: size * 0.22 },
        style,
      ]}
      resizeMode="contain"
      accessibilityLabel="KidNest"
    />
  );
}

const styles = StyleSheet.create({
  logoShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
});
