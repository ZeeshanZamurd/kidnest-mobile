import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { radius, typography } from '../../theme/colors';

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
  const scale = useSharedValue(1);
  const tickOpacity = useSharedValue(state === 'assigned' ? 1 : 0);

  useEffect(() => {
    if (state === 'success') {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 }),
      );
      tickOpacity.value = withTiming(1, { duration: 200 });
    } else if (state === 'assigned') {
      tickOpacity.value = withTiming(1, { duration: 180 });
      scale.value = withSpring(1);
    } else {
      tickOpacity.value = withTiming(0, { duration: 120 });
      scale.value = withSpring(1);
    }
  }, [state, scale, tickOpacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isAssigned = state === 'assigned' || state === 'success';
  const isLoading = state === 'loading';
  const disabled = isLoading;

  const accent = isAssigned ? SUCCESS_GREEN : colors.primary;

  if (variant === 'inline') {
    return (
      <Pressable onPress={onPress} disabled={disabled} hitSlop={8} style={style}>
        <Animated.View style={animStyle}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : isAssigned ? (
            <Icon name="checkmark-circle" size={24} color={SUCCESS_GREEN} />
          ) : (
            <Icon name="add-circle-outline" size={24} color={colors.primary} />
          )}
        </Animated.View>
      </Pressable>
    );
  }

  if (variant === 'compact') {
    return (
      <Pressable onPress={onPress} disabled={disabled} hitSlop={8} style={style}>
        <Animated.View style={[styles.compact, animStyle, isAssigned && styles.compactAssigned]}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : isAssigned ? (
            <Icon name="checkmark" size={16} color={SUCCESS_GREEN} />
          ) : (
            <Icon name="add" size={18} color={colors.primary} />
          )}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.full,
        {
          borderColor: accent,
          backgroundColor: isAssigned ? SUCCESS_GREEN + '12' : 'transparent',
        },
        style,
      ]}
    >
      <Animated.View style={[styles.fullInner, animStyle]}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : isAssigned ? (
          <>
            <Icon name="checkmark-circle" size={18} color={SUCCESS_GREEN} />
            <Text style={[styles.fullText, { color: SUCCESS_GREEN }]}>{assignedLabel}</Text>
          </>
        ) : (
          <>
            <Icon name="add-circle-outline" size={17} color={colors.primary} />
            <Text style={[styles.fullText, { color: colors.primary }]}>{label}</Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  full: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
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
});
