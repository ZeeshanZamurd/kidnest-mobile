import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import GradientBackground from '../../components/ui/GradientBackground';
import EmptyState from '../../components/ui/EmptyState';
import { useTheme } from '../../context/ThemeContext';
import { useWatchHistory } from '../../store/useAppStore';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { radius, spacing, typography } from '../../theme/colors';

export default function WatchHistoryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const history = useWatchHistory();
  const { headerTop } = useAppInsets();
  const listBottomPad = useStackScreenPadding();

  if (history.length === 0) {
    return (
      <GradientBackground>
        <EmptyState icon="time" title={t('no_history')} description={t('no_history_desc')} />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="subtle">
      <Text style={[styles.title, { color: colors.text, paddingTop: headerTop }]}>{t('history')}</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
            <View style={styles.meta}>
              <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>
                {item.videoTitle}
              </Text>
              <Text style={[styles.time, { color: colors.textMuted }]}>
                {item.durationMinutes} {t('minutes')} · {new Date(item.watchedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.md },
  row: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  thumb: { width: 120, height: 68 },
  meta: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  videoTitle: { ...typography.bodyBold, marginBottom: 4 },
  time: { ...typography.caption },
});
