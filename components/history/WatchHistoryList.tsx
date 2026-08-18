import React from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import EmptyState from '../ui/EmptyState';
import { HistoryListSkeleton } from '../child/ChildScreenSkeletons';
import { ChildLoadError } from '../child/ChildLoadFeedback';
import { useTheme } from '../../context/ThemeContext';
import { formatDuration } from '../../api/browse';
import type { WatchHistoryItem } from '../../api/watch';
import { radius, spacing, typography } from '../../theme/colors';

type Props = {
  history: WatchHistoryItem[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onVideoPress?: (videoId: string) => void;
  listBottomPad?: number;
  variant?: 'default' | 'child';
};

export default function WatchHistoryList({
  history,
  loading = false,
  error = false,
  onRetry,
  onVideoPress,
  listBottomPad = spacing.lg,
  variant = 'default',
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isChild = variant === 'child';
  const playColor = isChild ? colors.childPrimary : colors.primary;

  if (loading && history.length === 0) {
    return <HistoryListSkeleton />;
  }

  if (error && history.length === 0 && onRetry) {
    return (
      <ChildLoadError
        title={t('child_load_error')}
        description={t('child_load_error_desc')}
        retryLabel={t('try_again')}
        onRetry={onRetry}
      />
    );
  }

  if (!loading && history.length === 0) {
    return (
      <EmptyState branded icon="time" title={t('no_history')} description={t('no_history_desc')} />
    );
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
      renderItem={({ item }) => (
        <Pressable
          onPress={onVideoPress ? () => onVideoPress(item.videoId) : undefined}
          disabled={!onVideoPress}
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.thumbWrap}>
            <Image source={{ uri: item.video.thumbnailUrl ?? '' }} style={styles.thumb} />
            <View style={styles.duration}>
              <Text style={styles.durationText}>{formatDuration(item.video.durationSecs)}</Text>
            </View>
            {!item.completed && item.progressPercent > 0 ? (
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(item.progressPercent, 100)}%`,
                      backgroundColor: isChild ? '#FF6B9D' : colors.primary,
                    },
                  ]}
                />
              </View>
            ) : null}
          </View>
          <View style={styles.meta}>
            <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>
              {item.video.title}
            </Text>
            <Text style={[styles.channel, { color: colors.textMuted }]} numberOfLines={1}>
              {item.video.channelName}
            </Text>
            <Text style={[styles.time, { color: colors.textMuted }]}>
              {new Date(item.watchedAt).toLocaleDateString()}
              {item.completed ? ` · ${t('watched')}` : ` · ${Math.round(item.progressPercent)}%`}
            </Text>
          </View>
          {onVideoPress ? <Icon name="play-circle-outline" size={28} color={playColor} /> : null}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xxl },
  list: { paddingHorizontal: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  thumbWrap: {
    width: 120,
    height: 68,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  thumb: { width: '100%', height: '100%' },
  duration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  durationText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  progressFill: { height: '100%' },
  meta: { flex: 1, gap: 2 },
  videoTitle: { ...typography.bodyBold, fontSize: 14 },
  channel: { ...typography.caption },
  time: { ...typography.tiny },
});
