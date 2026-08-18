import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppLogo from '../brand/AppLogo';
import { useTheme } from '../../context/ThemeContext';
import { LOGO_SIZES } from '../../constants/branding';
import { radius, spacing, typography } from '../../theme/colors';

type Props = {
  icon: string;
  title: string;
  description: string;
  /** Show KidNest logo above the empty-state icon */
  branded?: boolean;
};

export default function EmptyState({ icon, title, description, branded = false }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {branded ? (
        <AppLogo size={LOGO_SIZES.emptyState} shadow={false} style={styles.brandLogo} />
      ) : null}
      <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18', borderColor: colors.accentSecondary + '40' }]}>
        <Icon name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.desc, { color: colors.textMuted }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  brandLogo: {
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  desc: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});
