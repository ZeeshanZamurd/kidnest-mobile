import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppLogo from './AppLogo';
import {
  BRAND_CHILD_ACCENT,
  BRAND_WHITE,
  LOGO_SIZES,
  SPLASH_TAGLINE,
  SPLASH_TITLE_KIDO,
  SPLASH_TITLE_NEST,
  SPLASH_TYPOGRAPHY,
} from '../../constants/branding';

type Props = {
  children?: React.ReactNode;
};

/** Centered splash branding — logo, title, tagline (matches native splash on iOS & Android). */
export default function SplashBranding({ children }: Props) {
  return (
    <View style={styles.stack} accessibilityRole="header">
      {children ?? <AppLogo size={LOGO_SIZES.splash} shadow={false} />}
      <Text style={styles.title} accessibilityLabel="KidoNest">
        <Text style={styles.kido}>{SPLASH_TITLE_KIDO}</Text>
        <Text style={styles.nest}>{SPLASH_TITLE_NEST}</Text>
      </Text>
      <Text style={styles.tagline}>{SPLASH_TAGLINE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    paddingHorizontal: 24,
  },
  title: {
    marginTop: SPLASH_TYPOGRAPHY.logoToTitle,
    fontSize: SPLASH_TYPOGRAPHY.titleSize,
    fontWeight: '800',
    letterSpacing: SPLASH_TYPOGRAPHY.titleTracking,
    textAlign: 'center',
  },
  kido: {
    color: BRAND_WHITE,
  },
  nest: {
    color: BRAND_CHILD_ACCENT,
  },
  tagline: {
    marginTop: SPLASH_TYPOGRAPHY.titleToTagline,
    color: 'rgba(255,255,255,0.82)',
    fontSize: SPLASH_TYPOGRAPHY.taglineSize,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
