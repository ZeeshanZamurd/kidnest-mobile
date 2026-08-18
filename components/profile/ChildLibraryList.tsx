import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import type { AssignedChannel, AssignedVideo } from '../../api/assignments';
import { formatDuration } from '../../api/browse';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';
import CachedImage from '../ui/CachedImage';

type ChannelRowProps = {
  item: AssignedChannel;
  onPress?: () => void;
  onRemove?: () => void;
};

type VideoRowProps = {
  item: AssignedVideo;
  onPress?: () => void;
  onRemove?: () => void;
};

function PlaceholderThumb({ icon }: { icon: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.thumbPlaceholder, { backgroundColor: colors.primary + '14' }]}>
      <Icon name={icon} size={22} color={colors.primary} />
    </View>
  );
}

export const ChildLibraryChannelRow = memo(function ChildLibraryChannelRow({
  item,
  onPress,
  onRemove,
}: ChannelRowProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed && onPress ? 0.92 : 1,
        },
      ]}
    >
      {item.channel.thumbnailUrl ? (
        <CachedImage uri={item.channel.thumbnailUrl} style={styles.thumb} />
      ) : (
        <PlaceholderThumb icon="tv-outline" />
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={[styles.typeBadge, { backgroundColor: colors.primary + '16' }]}>
            <Icon name="albums-outline" size={11} color={colors.primary} />
            <Text style={[styles.typeText, { color: colors.primary }]}>{t('channel')}</Text>
          </View>
        </View>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.channel.title}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
          {item.channel.primaryCategory?.name ?? t('channel')}
          {item.channel.primaryLanguage ? ` · ${item.channel.primaryLanguage.name}` : ''}
        </Text>
      </View>

      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={10} style={styles.actionBtn}>
          <Icon name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      ) : (
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </Pressable>
  );
});

export const ChildLibraryVideoRow = memo(function ChildLibraryVideoRow({
  item,
  onPress,
  onRemove,
}: VideoRowProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isShort = item.video.contentType === 'SHORT';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed && onPress ? 0.92 : 1,
        },
      ]}
    >
      {item.video.thumbnailUrl ? (
        <CachedImage uri={item.video.thumbnailUrl} style={styles.thumb} />
      ) : (
        <PlaceholderThumb icon={isShort ? 'flash-outline' : 'play-outline'} />
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: (isShort ? colors.accent : colors.primary) + '16' },
            ]}
          >
            <Icon
              name={isShort ? 'flash-outline' : 'play-circle-outline'}
              size={11}
              color={isShort ? colors.accent : colors.primary}
            />
            <Text
              style={[
                styles.typeText,
                { color: isShort ? colors.accent : colors.primary },
              ]}
            >
              {isShort ? t('short') : t('video')}
            </Text>
          </View>
          <Text style={[styles.duration, { color: colors.textMuted }]}>
            {formatDuration(item.video.durationSecs)}
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.video.title}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
          {item.video.channel.title}
        </Text>
      </View>

      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={10} style={styles.actionBtn}>
          <Icon name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      ) : (
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </Pressable>
  );
});

export function ChildLibrarySectionHeader({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.countBadge, { backgroundColor: colors.primary + '14' }]}>
        <Text style={[styles.countText, { color: colors.primary }]}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  thumb: {
    width: 72,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: '#E2E8F0',
  },
  thumbPlaceholder: {
    width: 72,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4, minWidth: 0 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  typeText: { ...typography.tiny, fontWeight: '700', textTransform: 'uppercase' },
  duration: { ...typography.tiny },
  title: { ...typography.bodyBold, fontSize: 15, lineHeight: 20 },
  meta: { ...typography.caption },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: { ...typography.h3, fontSize: 17 },
  countBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: { ...typography.caption, fontWeight: '700' },
});
