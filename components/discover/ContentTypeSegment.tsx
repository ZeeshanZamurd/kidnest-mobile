import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';

export type MediaFilter = 'ALL' | 'VIDEO' | 'SHORT';

type Option = { key: MediaFilter; label: string; icon: string };

const OPTIONS: Option[] = [
  { key: 'ALL', label: 'All', icon: 'grid-outline' },
  { key: 'VIDEO', label: 'Videos', icon: 'play-circle-outline' },
  { key: 'SHORT', label: 'Shorts', icon: 'flash-outline' },
];

type Props = {
  value: MediaFilter;
  onChange: (value: MediaFilter) => void;
  compact?: boolean;
};

export default function ContentTypeSegment({ value, onChange, compact }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {OPTIONS.map((opt) => {
        const active = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.chip,
              compact && styles.chipCompact,
              active
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Icon
              name={opt.icon}
              size={compact ? 14 : 16}
              color={active ? '#fff' : colors.textMuted}
            />
            <Text
              style={[
                styles.label,
                compact && styles.labelCompact,
                { color: active ? '#fff' : colors.textSecondary },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowCompact: {
    paddingHorizontal: 0,
    marginBottom: spacing.md,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  chipCompact: {
    flex: 0,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
  },
  labelCompact: {
    fontSize: 12,
  },
});
