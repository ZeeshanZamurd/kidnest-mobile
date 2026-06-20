import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import GradientBackground from '../../components/ui/GradientBackground';
import StatCard from '../../components/analytics/StatCard';
import { useTheme } from '../../context/ThemeContext';
import { useAnalytics } from '../../store/useAppStore';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { spacing, typography } from '../../theme/colors';

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const analytics = useAnalytics();
  const { headerTop } = useAppInsets();
  const scrollBottomPad = useStackScreenPadding();
  const maxMinutes = Math.max(...analytics.weeklyUsage.map((d) => d.minutes), 1);

  return (
    <GradientBackground variant="subtle">
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: headerTop, paddingBottom: scrollBottomPad }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('analytics')}</Text>

        <View style={styles.stats}>
          <StatCard icon="time" label={t('total_watch')} value={`${analytics.totalWatchMinutes}m`} />
          <StatCard icon="flame" label={t('top_category')} value={t(`category_${analytics.topCategory}`)} />
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
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  title: { ...typography.h1, marginBottom: spacing.lg },
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
  barTrack: {
    width: 24,
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: { ...typography.tiny },
  barValue: { ...typography.tiny, marginTop: 2 },
});
