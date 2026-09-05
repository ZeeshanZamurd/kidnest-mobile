import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/colors';

export type AssignButtonState = 'idle' | 'loading' | 'success' | 'assigned';

type Props = {
  state: AssignButtonState;
  onPress: () => void;
  variant?: 'compact' | 'full' | 'inline' | 'shelf';
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

  if (variant === 'shelf') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={isAssigned ? assignedLabel : label}
        style={[styles.shelfWrap, style]}
      >
        <View
          style={[
            styles.shelfBtn,
            {
              backgroundColor: isAssigned ? SUCCESS_GREEN : 'rgba(255,255,255,0.94)',
              borderColor: isAssigned ? SUCCESS_GREEN : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : isAssigned ? (
            <Icon name="checkmark" size={15} color="#fff" />
          ) : (
            <Icon name="add" size={18} color={colors.primary} />
          )}
        </View>
      </Pressable>
    );
  }

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
        <View
          style={[
            styles.compact,
            {
              borderColor: isAssigned ? SUCCESS_GREEN : colors.primary + '70',
              backgroundColor: isAssigned ? SUCCESS_GREEN + '18' : colors.primary + '10',
            },
          ]}
        >
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
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
  shelfWrap: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelfBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 3,
  },
});
