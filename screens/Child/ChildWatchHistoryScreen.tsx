import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import EmptyState from '../../components/ui/EmptyState';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { useChildWatchHistory } from '../../hooks/useChildWatchHistory';
import { useTabScreenPadding } from '../../hooks/useScreenPadding';
import { useAppInsets } from '../../hooks/useAppInsets';
import { formatDuration } from '../../api/browse';
import { radius, spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ChildWatchHistoryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const activeChildId = useAppStore((s) => s.activeChildId);
  const { history, loading } = useChildWatchHistory(activeChildId);
  const { headerTop } = useAppInsets();
  const listBottomPad = useTabScreenPadding();

  const openVideo = (videoId: string) => {
    navigation.navigate('VideoPlayer', { videoId });
  };

  if (!loading && history.length === 0) {
    return (
      <GradientBackground variant="child">
        <View style={{ paddingTop: headerTop }}>
          <Text style={[styles.title, { color: colors.text }]}>{t('history')}</Text>
        </View>
        <EmptyState icon="time" title={t('no_history')} description={t('no_history_desc')} />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="child">
      <Text style={[styles.title, { color: colors.text, paddingTop: headerTop }]}>
        {t('history')}
      </Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openVideo(item.videoId)}
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
                    style={[styles.progressFill, { width: `${Math.min(item.progressPercent, 100)}%` }]}
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
            <Icon name="play-circle-outline" size={28} color={colors.childPrimary} />
          </Pressable>
        )}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
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
  progressFill: { height: '100%', backgroundColor: '#FF6B9D' },
  meta: { flex: 1, gap: 2 },
  videoTitle: { ...typography.bodyBold, fontSize: 14 },
  channel: { ...typography.caption },
  time: { ...typography.tiny },
});
