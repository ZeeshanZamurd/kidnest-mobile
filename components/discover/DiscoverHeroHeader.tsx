import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppLogo from '../brand/AppLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { useTheme } from '../../context/ThemeContext';

/** Discover title row — sits on the shared content gutter (no extra horizontal pad). */
export default function DiscoverHeroHeader() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <AppLogo size={LOGO_SIZES.header} shadow={false} />
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {t('discover_title')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
});
