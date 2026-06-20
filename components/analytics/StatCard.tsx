import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';

type Props = {
  icon: string;
  label: string;
  value: string | number;
  accent?: string;
  /** Compact 2-column dashboard tile */
  compact?: boolean;
};

export default function StatCard({ icon, label, value, accent, compact }: Props) {
  const { colors } = useTheme();
  const iconColor = accent ?? colors.primary;

  if (compact) {
    return (
      <View style={[styles.compactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.compactIcon, { backgroundColor: iconColor + '18' }]}>
          <Icon name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.compactBody}>
          <Text style={[styles.compactValue, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.compactLabel, { color: colors.textMuted }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '18' }]}>
        <Icon name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    ...typography.h2,
    marginBottom: 2,
  },
  label: {
    ...typography.caption,
  },
  compactCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactBody: { flex: 1, minWidth: 0 },
  compactValue: { ...typography.h3, lineHeight: 22 },
  compactLabel: { ...typography.tiny, marginTop: 1 },
});
