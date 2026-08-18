import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppLogo from '../brand/AppLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography } from '../../theme/colors';

export default function DiscoverHeroHeader() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <AppLogo size={LOGO_SIZES.header} shadow={false} style={styles.iconBadge} />
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: colors.text }]}>{t('discover_title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('discover_subtitle')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    borderRadius: 10,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.h1,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  subtitle: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
});
