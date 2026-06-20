import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, typography } from '../../theme/colors';
import type { ApprovalStatus } from '../../types';

type Props = {
  label: string;
  status?: ApprovalStatus;
  color?: string;
};

const statusColors: Record<ApprovalStatus, string> = {
  approved: '#10B981',
  pending: '#F59E0B',
  blocked: '#EF4444',
};

export default function BadgePill({ label, status, color }: Props) {
  const { colors } = useTheme();
  const bg = color ?? (status ? statusColors[status] : colors.primary);

  return (
    <View style={[styles.pill, { backgroundColor: bg + '22' }]}>
      <View style={[styles.dot, { backgroundColor: bg }]} />
      <Text style={[styles.text, { color: bg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...typography.tiny,
    textTransform: 'capitalize',
  },
});
