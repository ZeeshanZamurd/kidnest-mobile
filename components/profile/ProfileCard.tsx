import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import ProfileAvatar from './ProfileAvatar';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';
import type { AvatarKey } from '../../constants/avatars';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  name: string;
  avatarKey?: AvatarKey;
  variant?: 'child' | 'parent';
  subtitle?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress: () => void;
};

export default function ProfileCard({
  name,
  avatarKey = 'lion',
  variant = 'child',
  subtitle,
  disabled,
  fullWidth,
  onPress,
}: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isParent = variant === 'parent';

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 14 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14 });
      }}
      style={[
        styles.card,
        fullWidth && styles.cardFull,
        animStyle,
        {
          backgroundColor: colors.card,
          borderColor: isParent ? colors.primary + '55' : colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {isParent ? (
        <View style={[styles.parentIcon, { backgroundColor: colors.primary + '18' }]}>
          <Icon name="lock-closed" size={36} color={colors.primary} />
        </View>
      ) : (
        <ProfileAvatar avatarKey={avatarKey} size={88} />
      )}
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {name}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    maxWidth: '48%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  cardFull: {
    maxWidth: '100%',
    minWidth: 200,
    width: '100%',
  },
  parentIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.bodyBold,
    fontSize: 16,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    textAlign: 'center',
  },
});
