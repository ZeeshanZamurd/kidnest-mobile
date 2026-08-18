import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import ProfileAvatar from './ProfileAvatar';
import { isAvatarKey } from '../../constants/avatars';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';
import type { ChildProfile } from '../../types';

type Props = {
  child: ChildProfile;
  selected?: boolean;
  onPress: () => void;
  onTogglePause?: () => void;
};

export default function ChildProfileCard({
  child,
  selected,
  onPress,
  onTogglePause,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const minutesLeft = Math.max(0, child.dailyLimitMinutes - child.screenTimeMinutes);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      {isAvatarKey(child.avatar) ? (
        <ProfileAvatar avatarKey={child.avatar} size={56} />
      ) : (
        <Image source={{ uri: child.avatar }} style={styles.avatar} />
      )}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]}>{child.name}</Text>
          {child.isPaused && (
            <View style={[styles.paused, { backgroundColor: colors.warning + '22' }]}>
              <Text style={{ color: colors.warning, ...typography.tiny }}>Paused</Text>
            </View>
          )}
        </View>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {t('age')} {child.age} · {t('minutes_left', { count: minutesLeft })}
        </Text>
        <Text style={[styles.streak, { color: colors.accent }]}>
          {t('streak', { count: child.streakDays })}
        </Text>
      </View>
      {onTogglePause ? (
        <Pressable onPress={onTogglePause} hitSlop={12}>
          <Icon
            name={child.isPaused ? 'play-circle' : 'pause-circle'}
            size={32}
            color={child.isPaused ? colors.success : colors.warning}
          />
        </Pressable>
      ) : null}
      <Icon name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
  },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { ...typography.bodyBold },
  meta: { ...typography.caption },
  streak: { ...typography.tiny },
  paused: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
});
