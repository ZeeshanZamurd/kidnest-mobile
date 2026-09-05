import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import ProfileAvatar from './ProfileAvatar';
import { isAvatarKey, type AvatarKey } from '../../constants/avatars';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';
import type { ChildProfile } from '../../types';

type Props = {
  child: ChildProfile;
  selected?: boolean;
  onPress: () => void;
  onTogglePause?: () => void;
  /** Denser row for Dashboard */
  compact?: boolean;
  /** Override stored avatar when parent loads meta */
  avatarKey?: AvatarKey;
  assignmentCount?: number;
};

export default function ChildProfileCard({
  child,
  selected,
  onPress,
  onTogglePause,
  compact = false,
  avatarKey,
  assignmentCount,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const minutesLeft = Math.max(0, child.dailyLimitMinutes - child.screenTimeMinutes);
  const avatarSize = compact ? 44 : 56;

  const resolvedKey: AvatarKey | null =
    avatarKey ?? (isAvatarKey(child.avatar) ? child.avatar : null);
  const remoteUri =
    !resolvedKey && typeof child.avatar === 'string' && child.avatar.startsWith('http')
      ? child.avatar
      : null;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        compact && styles.cardCompact,
        {
          backgroundColor: colors.card,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      {resolvedKey ? (
        <ProfileAvatar avatarKey={resolvedKey} size={avatarSize} />
      ) : remoteUri ? (
        <Image source={{ uri: remoteUri }} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }} />
      ) : (
        <ProfileAvatar avatarKey="lion" size={avatarSize} />
      )}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, compact && styles.nameCompact, { color: colors.text }]} numberOfLines={1}>
            {child.name}
          </Text>
          {child.isPaused && (
            <View style={[styles.paused, { backgroundColor: colors.warning + '22' }]}>
              <Text style={{ color: colors.warning, ...typography.tiny }}>Paused</Text>
            </View>
          )}
        </View>
        <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
          {t('age')} {child.age} · {t('minutes_left', { count: minutesLeft })}
        </Text>
        {!compact ? (
          <Text style={[styles.streak, { color: colors.accent }]}>
            {t('streak', { count: child.streakDays })}
          </Text>
        ) : assignmentCount != null && assignmentCount > 0 ? (
          <Text style={[styles.streak, { color: colors.textMuted }]}>
            {assignmentCount} video{assignmentCount === 1 ? '' : 's'} assigned
          </Text>
        ) : null}
      </View>
      {onTogglePause ? (
        <Pressable onPress={onTogglePause} hitSlop={12}>
          <Icon
            name={child.isPaused ? 'play-circle' : 'pause-circle'}
            size={compact ? 28 : 32}
            color={child.isPaused ? colors.success : colors.warning}
          />
        </Pressable>
      ) : null}
      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  cardCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 8,
  },
  info: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { ...typography.bodyBold },
  nameCompact: { fontSize: 15 },
  meta: { ...typography.caption },
  streak: { ...typography.tiny },
  paused: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
});
