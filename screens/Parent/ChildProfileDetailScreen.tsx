import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import EmptyState from '../../components/ui/EmptyState';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ProfileAvatar from '../../components/profile/ProfileAvatar';
import {
  ChildLibraryChannelRow,
  ChildLibrarySectionHeader,
  ChildLibraryVideoRow,
} from '../../components/profile/ChildLibraryList';
import ContentTypeSegment, { type MediaFilter } from '../../components/discover/ContentTypeSegment';
import { BRAND_GRADIENT_FULL } from '../../constants/branding';
import { isAvatarKey } from '../../constants/avatars';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { useParentChildLibrary } from '../../hooks/useParentChildLibrary';
import { useAppStore } from '../../store/useAppStore';
import { useDisplayChildren } from '../../hooks/useDisplayChildren';
import { toggleChildPauseApi } from '../../api/parent';
import { KidAlert } from '../../services/kidAlert';
import { spacing, typography, radius } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';

type Route = RouteProp<RootStackParamList, 'ChildProfileDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: colors.primary + '14' }]}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function ChildProfileDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { childId } = route.params;
  const { headerTop } = useAppInsets();
  const bottomPad = useStackScreenPadding();
  const setActiveChild = useAppStore((s) => s.setActiveChild);
  const platformAccess = useAppStore((s) => s.platformAccess);
  const canRemoveLibrary = platformAccess?.hasFullVideoAccess ?? false;
  const { displayChildren, reload: reloadChildren } = useDisplayChildren();

  const child = displayChildren.find((c) => c.id === childId);
  const [filter, setFilter] = useState<MediaFilter>('ALL');

  const {
    channels,
    longVideos,
    shortVideos,
    stats,
    loading,
    refreshing,
    reload,
    removeVideoItem,
    removeChannelItem,
  } = useParentChildLibrary(childId);

  const showChannels = filter === 'ALL';
  const showVideos = filter === 'ALL' || filter === 'VIDEO';
  const showShorts = filter === 'ALL' || filter === 'SHORT';

  const isEmpty = useMemo(() => {
    if (filter === 'ALL') return stats.total === 0;
    if (filter === 'VIDEO') return stats.videos === 0;
    return stats.shorts === 0;
  }, [filter, stats]);

  const handleTogglePause = useCallback(async () => {
    try {
      await toggleChildPauseApi(childId);
      await reloadChildren();
    } catch {
      KidAlert.alert('Error', t('child_profile_pause_error', 'Could not update profile.'));
    }
  }, [childId, reloadChildren, t]);

  const confirmRemoveVideo = useCallback(
    (videoId: string, title: string) => {
      KidAlert.alert(t('remove_video_title', 'Remove video?'), title, [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: () => void removeVideoItem(videoId),
        },
      ]);
    },
    [removeVideoItem, t],
  );

  const confirmRemoveChannel = useCallback(
    (channelId: string, title: string) => {
      KidAlert.alert(t('remove_channel_title', 'Remove channel?'), title, [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: () => void removeChannelItem(channelId),
        },
      ]);
    },
    [removeChannelItem, t],
  );

  const openDiscover = useCallback(() => {
    setActiveChild(childId);
    navigation.navigate('ParentTabs', { screen: 'Discover' });
  }, [childId, navigation, setActiveChild]);

  return (
    <GradientBackground variant="subtle">
      <View style={[styles.header, { paddingTop: headerTop }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {t('child_profile_detail')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void reload(true)}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LinearGradient colors={BRAND_GRADIENT_FULL} style={styles.heroStripe} />
          <View style={styles.heroRow}>
            {child && isAvatarKey(child.avatar) ? (
              <ProfileAvatar avatarKey={child.avatar} size={64} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.primary + '18' }]}>
                <Icon name="person" size={28} color={colors.primary} />
              </View>
            )}
            <View style={styles.heroMeta}>
              <Text style={[styles.heroName, { color: colors.text }]} numberOfLines={1}>
                {child?.name ?? t('child_profile')}
              </Text>
              {child ? (
                <Text style={[styles.heroSub, { color: colors.textMuted }]}>
                  {t('age')} {child.age}
                  {child.isPaused ? ` · ${t('profile_paused')}` : ''}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => void handleTogglePause()}
              style={[styles.pauseBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Icon
                name={child?.isPaused ? 'play' : 'pause'}
                size={18}
                color={child?.isPaused ? colors.success : colors.warning}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label={t('channels')} value={stats.channels} icon="albums-outline" />
          <StatCard label={t('videos')} value={stats.videos} icon="play-circle-outline" />
          <StatCard label={t('shorts')} value={stats.shorts} icon="flash-outline" />
        </View>

        <ContentTypeSegment value={filter} onChange={setFilter} compact />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : isEmpty ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              branded
              icon="library-outline"
              title={t('child_library_empty_title')}
              description={t('child_library_empty_desc')}
            />
            <PrimaryButton
              label={t('browse_and_add')}
              onPress={openDiscover}
              style={styles.emptyBtn}
            />
          </View>
        ) : (
          <>
            {showChannels && channels.length > 0 ? (
              <View style={styles.section}>
                <ChildLibrarySectionHeader title={t('channels')} count={channels.length} />
                {channels.map((item) => (
                  <ChildLibraryChannelRow
                    key={item.id}
                    item={item}
                    onPress={() => navigation.navigate('ChannelDetail', { channelId: item.channelId })}
                    onRemove={
                      canRemoveLibrary
                        ? () => confirmRemoveChannel(item.channelId, item.channel.title)
                        : undefined
                    }
                  />
                ))}
              </View>
            ) : null}

            {showVideos && longVideos.length > 0 ? (
              <View style={styles.section}>
                <ChildLibrarySectionHeader title={t('videos')} count={longVideos.length} />
                {longVideos.map((item) => (
                  <ChildLibraryVideoRow
                    key={item.id}
                    item={item}
                    onPress={() => navigation.navigate('VideoPlayer', { videoId: item.videoId })}
                    onRemove={
                      canRemoveLibrary
                        ? () => confirmRemoveVideo(item.videoId, item.video.title)
                        : undefined
                    }
                  />
                ))}
              </View>
            ) : null}

            {showShorts && shortVideos.length > 0 ? (
              <View style={styles.section}>
                <ChildLibrarySectionHeader title={t('shorts')} count={shortVideos.length} />
                {shortVideos.map((item) => (
                  <ChildLibraryVideoRow
                    key={item.id}
                    item={item}
                    onPress={() => navigation.navigate('VideoPlayer', { videoId: item.videoId })}
                    onRemove={
                      canRemoveLibrary
                        ? () => confirmRemoveVideo(item.videoId, item.video.title)
                        : undefined
                    }
                  />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h2,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  hero: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  heroStripe: {
    height: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMeta: { flex: 1, gap: 4, minWidth: 0 },
  heroName: { ...typography.h2, fontSize: 22 },
  heroSub: { ...typography.caption },
  pauseBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { ...typography.h2, fontSize: 20 },
  statLabel: { ...typography.tiny, textAlign: 'center' },
  section: {
    marginBottom: spacing.sm,
  },
  loader: {
    marginTop: spacing.xl,
  },
  emptyWrap: {
    paddingTop: spacing.md,
  },
  emptyBtn: {
    marginTop: spacing.lg,
    alignSelf: 'center',
  },
});
