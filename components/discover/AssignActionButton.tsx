import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/colors';

export type AssignButtonState = 'idle' | 'loading' | 'success' | 'assigned';

type Props = {
  state: AssignButtonState;
  onPress: () => void;
  variant?: 'compact' | 'full' | 'inline';
  label?: string;
  assignedLabel?: string;
  style?: ViewStyle;
};

const SUCCESS_GREEN = '#10B981';

export default function AssignActionButton({
  state,
  onPress,
  variant = 'full',
  label = 'Add',
  assignedLabel = 'Added',
  style,
}: Props) {
  const { colors } = useTheme();
  const isAssigned = state === 'assigned' || state === 'success';
  const isLoading = state === 'loading';
  const disabled = isLoading;
  const accent = isAssigned ? SUCCESS_GREEN : colors.primary;

  if (variant === 'inline') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        hitSlop={8}
        style={[styles.inlineWrap, style]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : isAssigned ? (
          <Icon name="checkmark-circle" size={24} color={SUCCESS_GREEN} />
        ) : (
          <Icon name="add-circle" size={26} color={colors.primary} />
        )}
      </Pressable>
    );
  }

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        hitSlop={8}
        style={[styles.compactWrap, style]}
      >
        <View style={[styles.compact, isAssigned && styles.compactAssigned]}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : isAssigned ? (
            <Icon name="checkmark" size={16} color={SUCCESS_GREEN} />
          ) : (
            <Icon name="add" size={18} color={colors.primary} />
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.fullWrap, style]}>
      <View
        style={[
          styles.full,
          {
            borderColor: accent,
            backgroundColor: isAssigned ? SUCCESS_GREEN + '12' : colors.primary + '08',
          },
        ]}
      >
        <View style={styles.fullInner}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : isAssigned ? (
            <>
              <Icon name="checkmark-circle" size={18} color={SUCCESS_GREEN} />
              <Text style={[styles.fullText, { color: SUCCESS_GREEN }]}>{assignedLabel}</Text>
            </>
          ) : (
            <>
              <Icon name="add-circle" size={18} color={colors.primary} />
              <Text style={[styles.fullText, { color: colors.primary }]}>{label}</Text>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWrap: {
    alignSelf: 'flex-start',
  },
  full: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fullInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 72,
    justifyContent: 'center',
  },
  fullText: {
    fontSize: 13,
    fontWeight: '700',
  },
  compactWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAssigned: {
    backgroundColor: SUCCESS_GREEN + '18',
  },
  inlineWrap: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
