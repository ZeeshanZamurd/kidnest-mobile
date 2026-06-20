import React from 'react';
import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

const APP_ICON = require('../../assets/branding/app-icon-splash.png');

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

/** Official KidNest app icon for in-app branding. */
export default function AppLogo({ size = 120, style }: Props) {
  return (
    <Image
      source={APP_ICON}
      style={[styles.logo, { width: size, height: size, borderRadius: size * 0.22 }, style]}
      resizeMode="contain"
      accessibilityLabel="KidNest"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
});
