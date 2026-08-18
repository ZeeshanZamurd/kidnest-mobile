import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import SkeletonLoader from '../ui/SkeletonLoader';
import { radius, spacing } from '../../theme/colors';

function SectionTitleSkeleton() {
  return (
    <View style={styles.sectionHeader}>
      <SkeletonLoader width={140} height={18} borderRadius={radius.sm} />
    </View>
  );
}

function HorizontalVideoSkeleton() {
  return (
    <View style={styles.hVideo}>
      <SkeletonLoader width={168} height={94} borderRadius={radius.lg} />
      <SkeletonLoader width={140} height={12} style={{ marginTop: 8 }} />
      <SkeletonLoader width={90} height={10} style={{ marginTop: 6 }} />
    </View>
  );
}

function ChannelChipSkeleton() {
  return (
    <View style={styles.channelChip}>
      <SkeletonLoader width={64} height={64} borderRadius={radius.full} />
      <SkeletonLoader width={72} height={10} style={{ marginTop: 8 }} />
    </View>
  );
}

function FeedVideoSkeleton() {
  return (
    <View style={styles.feedCard}>
      <SkeletonLoader height={180} borderRadius={radius.lg} />
      <SkeletonLoader width="75%" height={14} style={{ marginTop: 12 }} />
      <SkeletonLoader width="45%" height={11} style={{ marginTop: 8 }} />
    </View>
  );
}

export function ChildHomeSkeleton() {
  return (
    <View style={styles.home}>
      <SectionTitleSkeleton />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
        {[0, 1, 2].map((i) => (
          <HorizontalVideoSkeleton key={`cw-${i}`} />
        ))}
      </ScrollView>

      <SectionTitleSkeleton />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
        {[0, 1, 2].map((i) => (
          <HorizontalVideoSkeleton key={`sg-${i}`} />
        ))}
      </ScrollView>

      <SectionTitleSkeleton />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
        {[0, 1, 2, 3].map((i) => (
          <ChannelChipSkeleton key={`ch-${i}`} />
        ))}
      </ScrollView>

      <SectionTitleSkeleton />
      <FeedVideoSkeleton />
      <FeedVideoSkeleton />
    </View>
  );
}

export function ChildThemesSkeleton() {
  return (
    <View style={styles.themes}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.themeBlock}>
          <SkeletonLoader width={120} height={20} borderRadius={radius.md} style={{ marginBottom: 12 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {[0, 1, 2].map((j) => (
              <HorizontalVideoSkeleton key={`${i}-${j}`} />
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

export function ChildShortsSkeleton() {
  const pageH = Dimensions.get('window').height;
  return (
    <View style={styles.shorts}>
      <SkeletonLoader width="100%" height={pageH * 0.78} borderRadius={0} />
      <View style={styles.shortsMeta}>
        <SkeletonLoader width="60%" height={16} borderRadius={radius.sm} />
        <SkeletonLoader width="40%" height={12} borderRadius={radius.sm} style={{ marginTop: 10 }} />
      </View>
    </View>
  );
}

export function HistoryListSkeleton() {
  return (
    <View style={styles.history}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.historyRow}>
          <SkeletonLoader width={120} height={68} borderRadius={radius.md} />
          <View style={styles.historyMeta}>
            <SkeletonLoader width="90%" height={14} />
            <SkeletonLoader width="55%" height={11} style={{ marginTop: 8 }} />
            <SkeletonLoader width="40%" height={10} style={{ marginTop: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ChannelDetailSkeleton() {
  return (
    <View style={styles.channelDetail}>
      <View style={styles.channelHero}>
        <SkeletonLoader width={52} height={52} borderRadius={radius.md} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonLoader width="70%" height={16} />
          <SkeletonLoader width="45%" height={12} />
          <SkeletonLoader width="90%" height={11} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={36} borderRadius={radius.lg} style={{ marginBottom: spacing.md }} />
      <FeedVideoSkeleton />
      <FeedVideoSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  home: { paddingTop: spacing.sm },
  sectionHeader: { paddingHorizontal: spacing.md, marginBottom: spacing.sm, marginTop: spacing.md },
  hRow: { paddingHorizontal: spacing.md, gap: spacing.md },
  hVideo: { marginRight: spacing.md },
  channelChip: { alignItems: 'center', marginRight: spacing.md },
  feedCard: { marginHorizontal: spacing.md, marginBottom: spacing.lg },
  themes: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  themeBlock: { marginBottom: spacing.xl },
  shorts: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xxl,
  },
  shortsMeta: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  history: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  historyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  historyMeta: { flex: 1 },
  channelDetail: { padding: spacing.md },
  channelHero: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
});
