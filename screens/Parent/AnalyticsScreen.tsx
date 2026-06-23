import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import StatCard from '../../components/analytics/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { useParentAnalytics } from '../../hooks/useParentAnalytics';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { spacing, typography, radius } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatCategory(category: string, t: (key: string) => string) {
  const key = `category_${category}`;
  const translated = t(key);
  return translated === key ? category.replace(/_/g, ' ') : translated;
}

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const platformAccess = useAppStore((s) => s.platformAccess);
  const apiChildren = useAppStore((s) => s.apiChildren);
  const activeChildId = useAppStore((s) => s.activeChildId);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    activeChildId ?? apiChildren[0]?.id ?? null,
  );

  const hasPremium = Boolean(platformAccess?.hasAccess);
  const { analytics, loading, subscriptionRequired } = useParentAnalytics(
    selectedChildId,
    hasPremium,
  );
  const { headerTop } = useAppInsets();
  const scrollBottomPad = useStackScreenPadding();
  const maxMinutes = Math.max(...analytics.weeklyUsage.map((d) => d.minutes), 1);

  if (!hasPremium || subscriptionRequired) {
    return (
      <GradientBackground variant="subtle">
        <View style={[styles.paywall, { paddingTop: headerTop, paddingBottom: scrollBottomPad }]}>
          <View style={[styles.paywallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.paywallIcon, { backgroundColor: colors.primary + '16' }]}>
              <Icon name="analytics" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.paywallTitle, { color: colors.text }]}>{t('analytics_premium_title')}</Text>
            <Text style={[styles.paywallDesc, { color: colors.textMuted }]}>
              {t('analytics_premium_desc')}
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Subscription')}
              style={[styles.paywallBtn, { backgroundColor: colors.primary }]}
            >
              <Icon name="diamond" size={18} color="#fff" />
              <Text style={styles.paywallBtnText}>{t('unlock_analytics')}</Text>
            </Pressable>
          </View>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="subtle">
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: headerTop, paddingBottom: scrollBottomPad },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>{t('child_analytics')}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('child_analytics_desc')}</Text>

        {apiChildren.length > 1 && (
          <FlatList
            horizontal
            data={apiChildren}
            keyExtractor={(c) => c.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.childPicker}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedChildId(item.id)}
                style={[
                  styles.childChip,
                  {
                    backgroundColor: selectedChildId === item.id ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selectedChildId === item.id ? '#fff' : colors.text,
                    fontWeight: '600',
                  }}
                >
                  {item.user.displayName}
                </Text>
              </Pressable>
            )}
          />
        )}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : analytics.totalWatchSessions === 0 ? (
          <EmptyState
            icon="analytics"
            title={t('no_analytics_yet')}
            description={t('no_analytics_yet_desc')}
          />
        ) : (
          <>
            <View style={styles.stats}>
              <StatCard
                icon="time"
                label={t('total_watch')}
                value={`${analytics.totalWatchMinutes}m`}
              />
              <StatCard
                icon="flame"
                label={t('top_interest')}
                value={formatCategory(analytics.topCategory, t)}
              />
            </View>

            <Text style={[styles.section, { color: colors.text }]}>{t('weekly_usage')}</Text>
            <View style={[styles.chart, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {analytics.weeklyUsage.map((day) => (
                <View key={day.day} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${(day.minutes / maxMinutes) * 100}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textMuted }]}>{day.day}</Text>
                  <Text style={[styles.barValue, { color: colors.text }]}>{day.minutes}</Text>
                </View>
              ))}
            </View>

            {analytics.categoryBreakdown.length > 0 && (
              <>
                <Text style={[styles.section, { color: colors.text }]}>{t('interests')}</Text>
                <View style={[styles.interestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {analytics.categoryBreakdown.map((item) => (
                    <View key={item.category} style={styles.interestRow}>
                      <Text style={[styles.interestLabel, { color: colors.text }]}>
                        {formatCategory(item.category, t)}
                      </Text>
                      <View style={[styles.interestTrack, { backgroundColor: colors.border }]}>
                        <View
                          style={[
                            styles.interestFill,
                            { width: `${item.percent}%`, backgroundColor: colors.accent },
                          ]}
                        />
                      </View>
                      <Text style={[styles.interestPct, { color: colors.textMuted }]}>
                        {item.percent}%
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {analytics.mostWatchedVideos.length > 0 && (
              <>
                <Text style={[styles.section, { color: colors.text }]}>{t('most_watched')}</Text>
                {analytics.mostWatchedVideos.map((item, index) => (
                  <View
                    key={item.videoId}
                    style={[styles.mostRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.rank, { color: colors.primary }]}>{index + 1}</Text>
                    <Image source={{ uri: item.thumbnailUrl ?? '' }} style={styles.mostThumb} />
                    <View style={styles.mostMeta}>
                      <Text style={[styles.mostTitle, { color: colors.text }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={[styles.mostSub, { color: colors.textMuted }]} numberOfLines={1}>
                        {item.channelName} · {item.watchCount} {t('views_label')} · {item.watchMinutes}m
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  title: { ...typography.h1, marginBottom: 4 },
  subtitle: { ...typography.caption, marginBottom: spacing.lg, lineHeight: 18 },
  childPicker: { gap: 8, marginBottom: spacing.lg },
  childChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginRight: 8,
  },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  section: { ...typography.h3, marginTop: spacing.xl, marginBottom: spacing.md },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    height: 200,
    alignItems: 'flex-end',
  },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { width: 24, height: 120, justifyContent: 'flex-end', marginBottom: 8 },
  barFill: { width: '100%', borderRadius: 6, minHeight: 4 },
  barLabel: { ...typography.tiny },
  barValue: { ...typography.tiny, marginTop: 2 },
  interestCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  interestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  interestLabel: { width: 72, ...typography.caption, fontWeight: '600' },
  interestTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  interestFill: { height: '100%', borderRadius: 4 },
  interestPct: { width: 36, textAlign: 'right', ...typography.tiny },
  mostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  rank: { ...typography.bodyBold, width: 20, textAlign: 'center' },
  mostThumb: { width: 72, height: 42, borderRadius: radius.sm },
  mostMeta: { flex: 1 },
  mostTitle: { ...typography.bodyBold, fontSize: 14, marginBottom: 2 },
  mostSub: { ...typography.caption },
  paywall: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  paywallCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  paywallIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallTitle: { ...typography.h2, textAlign: 'center' },
  paywallDesc: { ...typography.body, textAlign: 'center', lineHeight: 22 },
  paywallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  paywallBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
