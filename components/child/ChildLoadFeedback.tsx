import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import EmptyState from '../ui/EmptyState';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';

type Props = {
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
};

export function ChildLoadError({ title, description, retryLabel, onRetry }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <EmptyState icon="cloud-offline-outline" title={title} description={description} branded />
      <Pressable
        onPress={onRetry}
        style={[styles.retryBtn, { backgroundColor: colors.childPrimary }]}
        accessibilityRole="button"
      >
        <Icon name="refresh" size={18} color="#fff" />
        <Text style={styles.retryText}>{retryLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.full,
    marginTop: -spacing.sm,
  },
  retryText: {
    ...typography.bodyBold,
    color: '#fff',
  },
});
