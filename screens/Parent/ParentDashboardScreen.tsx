import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import GradientBackground from '../../components/ui/GradientBackground';
import SectionHeader from '../../components/ui/SectionHeader';
import StatCard from '../../components/analytics/StatCard';
import VideoCard from '../../components/video/VideoCard';
import ChildProfileCard from '../../components/profile/ChildProfileCard';
import SelectedChildBar from '../../components/profile/SelectedChildBar';
import ChildProfilePickerModal from '../../components/profile/ChildProfilePickerModal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { browseVideos, formatDuration } from '../../api/browse';
import { fetchParentDashboard } from '../../api/parent';
import type { BrowseVideo } from '../../api/browse';
import { useTabScreenPadding } from '../../hooks/useScreenPadding';
import { loadChildProfileMetaMap } from '../../services/childProfileMetaStorage';
import { avatarKeyForIndex, type AvatarKey } from '../../constants/avatars';
import { radius, spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import type { Video } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type DashboardStats = {
  children: number;
  assignments: number;
  channels: number;
  videosAvailable: number;
};

function toVideoCard(v: BrowseVideo): Video {
  return {
    id: v.id,
    title: v.title,
    thumbnail: v.thumbnailUrl ?? '',
    duration: formatDuration(v.durationSecs),
    durationSeconds: v.durationSecs,
    channelId: v.channelId,
    channelName: v.channelName,
    category: 'science',
    status: 'approved',
    views: '0',
    publishedAt: v.createdAt,
    isFavorite: false,
    watchProgress: 0,
  };
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function resolveDisplayName(
  parentSession: ReturnType<typeof useAppStore.getState>['parentSession'],
  mockName: string,
): string {
  if (parentSession) {
    return (
      parentSession.backendUser.displayName?.trim() ||
      parentSession.backendUser.email?.split('@')[0]?.trim() ||
      ''
    );
  }
  return mockName.trim();
}

type QuickActionProps = {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
};

function QuickAction({ icon, label, color, onPress }: QuickActionProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.quickActionLabel, { color: colors.text }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function StatsSkeleton() {
  return (
    <View style={styles.statsGrid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.statSkeleton}>
          <SkeletonLoader width={36} height={36} borderRadius={radius.md} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonLoader width="40%" height={18} />
            <SkeletonLoader width="65%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

function VideoRowSkeleton() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.videoRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.videoSkeleton}>
          <SkeletonLoader width={168} height={94} borderRadius={radius.lg} />
          <SkeletonLoader width={140} height={12} style={{ marginTop: 8 }} />
        </View>
      ))}
    </ScrollView>
  );
}

const SETUP_STEPS = [
  { icon: 'person-add', label: 'Add child', key: 'child' },
  { icon: 'compass', label: 'Discover', key: 'discover' },
  { icon: 'checkmark-circle', label: 'Assign', key: 'assign' },
] as const;

export default function ParentDashboardScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const parent = useAppStore((s) => s.parent);
  const apiChildren = useAppStore((s) => s.apiChildren);
  const activeChildId = useAppStore((s) => s.activeChildId);
  const setActiveChild = useAppStore((s) => s.setActiveChild);
  const parentSession = useAppStore((s) => s.parentSession);
  const platformAccess = useAppStore((s) => s.platformAccess);
  const scrollBottomPad = useTabScreenPadding(spacing.xl);

  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [childPickerVisible, setChildPickerVisible] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    children: 0,
    assignments: 0,
    channels: 0,
    videosAvailable: 0,
  });
  const [avatarByChildId, setAvatarByChildId] = useState<Record<string, AvatarKey>>({});
  const [displayName, setDisplayName] = useState(() =>
    resolveDisplayName(parentSession, parent.name ?? ''),
  );

  useEffect(() => {
    setDisplayName(resolveDisplayName(parentSession, parent.name ?? ''));
  }, [parentSession, parent.name]);

  useEffect(() => {
    if (!apiChildren.length) {
      setAvatarByChildId({});
      return;
    }
    void loadChildProfileMetaMap().then((map) => {
      const next: Record<string, AvatarKey> = {};
      apiChildren.forEach((c, index) => {
        const stored = map[c.id]?.avatarKey;
        next[c.id] = stored ?? avatarKeyForIndex(index);
      });
      setAvatarByChildId(next);
    });
  }, [apiChildren]);

  useEffect(() => {
    if (!parentSession?.idToken) {
      setLoading(false);
      return;
    }

    void Promise.all([
      browseVideos({ limit: 12, page: 1 }),
      fetchParentDashboard().catch(() => null),
    ])
      .then(([videoRes, dashboard]) => {
        setRecentVideos(videoRes.data.map(toVideoCard));
        if (dashboard) {
          const name = dashboard.parent.displayName?.trim();
          if (name) setDisplayName(name);
          setStats({
            children: dashboard.usage.children,
            assignments: dashboard.usage.assignments,
            channels: dashboard.usage.channels,
            videosAvailable: dashboard.stats.totalVideosAvailable,
          });
        }
      })
      .catch(() => setRecentVideos([]))
      .finally(() => setLoading(false));
  }, [parentSession?.idToken]);

  const children = apiChildren.length
    ? apiChildren.map((c) => ({
        id: c.id,
        name: c.user.displayName,
        age: c.age,
        avatar: avatarByChildId[c.id] ?? 'lion',
        dailyLimitMinutes: 60,
        screenTimeMinutes: 0,
        isPaused: c.isPaused,
        streakDays: 0,
        interests: [] as const,
        badges: [] as string[],
        assignmentCount: c._count?.assignments ?? 0,
      }))
    : [];

  const planInfo = useMemo(() => {
    const sub = platformAccess?.subscription;
    const status = (sub?.status ?? platformAccess?.subscriptionStatus ?? '').toUpperCase();
    const isActive =
      Boolean(platformAccess?.hasFullVideoAccess) ||
      status === 'ACTIVE' ||
      status === 'TRIALING';
    const isFree = platformAccess?.accessType === 'FREE' && !isActive;

    if (isActive) {
      const end = sub?.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : null;
      return {
        title: sub?.planName?.trim() || 'KidNest Premium',
        subtitle: end ? `Active · renews ${end}` : 'Active subscription · View billing',
        badge: 'Premium',
        icon: 'diamond' as const,
        accent: true,
      };
    }

    if (isFree) {
      return {
        title: 'Free plan',
        subtitle: 'Free region access · Upgrade for more',
        badge: 'Free',
        icon: 'sparkles-outline' as const,
        accent: false,
      };
    }

    return {
      title: 'KidNest Premium',
      subtitle: 'Subscribe to unlock full access',
      badge: 'Upgrade',
      icon: 'diamond-outline' as const,
      accent: false,
    };
  }, [platformAccess]);

  const isNewUser =
    !loading &&
    stats.children === 0 &&
    stats.assignments === 0 &&
    stats.channels === 0;

  const setupStep = stats.children === 0 ? 0 : stats.assignments === 0 ? 1 : 2;

  const activityItems = useMemo(() => {
    const items: { id: string; icon: string; text: string; color: string }[] = [];

    recentVideos.slice(0, 3).forEach((v) => {
      items.push({
        id: `video-${v.id}`,
        icon: 'film-outline',
        text: `New video: ${v.title}`,
        color: colors.primary,
      });
    });

    children.slice(0, 2).forEach((c) => {
      if (c.assignmentCount > 0) {
        items.push({
          id: `child-${c.id}`,
          icon: 'person-outline',
          text: `${c.name} has ${c.assignmentCount} assigned video${c.assignmentCount === 1 ? '' : 's'}`,
          color: colors.accentSecondary,
        });
      }
    });

    if (stats.channels > 0) {
      items.push({
        id: 'channels',
        icon: 'tv-outline',
        text: `${stats.channels} channel${stats.channels === 1 ? '' : 's'} in your library`,
        color: colors.accent,
      });
    }

    return items.slice(0, 5);
  }, [recentVideos, children, stats.channels, colors]);

  const goDiscover = () => navigation.navigate('ParentTabs');

  const firstName = displayName.split(' ')[0] || displayName || t('role_parent');

  return (
    <GradientBackground variant="subtle">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
      >
        {/* Hero welcome */}
        <Animated.View entering={FadeInDown.duration(380)}>
          <LinearGradient
            colors={[colors.gradientStart + 'E6', colors.gradientMid + 'CC', colors.gradientEnd + '99']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroText}>
                <Text style={styles.heroGreeting}>{getTimeGreeting()}</Text>
                <Text style={styles.heroName}>{firstName}</Text>
                <Text style={styles.heroSub}>
                  {isNewUser
                    ? 'Set up your nest in a few quick steps'
                    : 'Your family content hub is ready'}
                </Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate('Notifications')}
                style={styles.heroNotif}
              >
                <Icon name="notifications-outline" size={22} color="#fff" />
              </Pressable>
            </View>

            {!loading && (
              <View style={styles.heroPills}>
                <View style={styles.heroPill}>
                  <Icon name="people" size={14} color="#fff" />
                  <Text style={styles.heroPillText}>{stats.children} children</Text>
                </View>
                <View style={styles.heroPill}>
                  <Icon name="videocam" size={14} color="#fff" />
                  <Text style={styles.heroPillText}>{stats.assignments} assigned</Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {apiChildren.length > 0 ? (
          <View style={styles.childSwitchWrap}>
            <SelectedChildBar
              children={apiChildren}
              activeChildId={activeChildId ?? apiChildren[0]?.id ?? null}
              onSelectChild={setActiveChild}
              onOpenPicker={() => setChildPickerVisible(true)}
            />
          </View>
        ) : null}

        {/* Quick actions — above the fold */}
        <Animated.View entering={FadeInDown.duration(400).delay(40)} style={styles.quickActionsWrap}>
          <View style={styles.quickActions}>
            <QuickAction
              icon="person-add"
              label={t('add_child')}
              color={colors.primary}
              onPress={() => navigation.navigate('AddChild')}
            />
            <QuickAction
              icon="add-circle"
              label={t('add_video')}
              color={colors.accentSecondary}
              onPress={goDiscover}
            />
            <QuickAction
              icon="albums"
              label="Add Channel"
              color={colors.accent}
              onPress={goDiscover}
            />
            <QuickAction
              icon="analytics"
              label="Analytics"
              color={colors.success}
              onPress={() => navigation.navigate('Analytics')}
            />
          </View>
        </Animated.View>

        {/* Subscription / plan */}
        <Animated.View entering={FadeInDown.duration(410).delay(50)} style={styles.section}>
          <Pressable
            onPress={() => navigation.navigate('Subscription')}
            style={[
              styles.premiumBanner,
              {
                backgroundColor: planInfo.accent ? colors.primary + '10' : colors.card,
                borderColor: planInfo.accent ? colors.primary + '44' : colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.premiumIcon,
                {
                  backgroundColor: planInfo.accent
                    ? colors.primary + '22'
                    : colors.primary + '14',
                },
              ]}
            >
              <Icon
                name={planInfo.icon}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.premiumText}>
              <View style={styles.premiumTitleRow}>
                <Text style={[styles.premiumTitle, { color: colors.text }]} numberOfLines={1}>
                  {planInfo.title}
                </Text>
                <View
                  style={[
                    styles.planBadge,
                    {
                      backgroundColor: planInfo.accent
                        ? colors.primary
                        : colors.border + 'AA',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.planBadgeText,
                      { color: planInfo.accent ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {planInfo.badge}
                  </Text>
                </View>
              </View>
              <Text style={[styles.premiumDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                {planInfo.subtitle}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </Animated.View>

        {/* Get started — zero state */}
        {!loading && isNewUser && (
          <Animated.View entering={FadeInDown.duration(420).delay(60)} style={styles.section}>
            <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.setupTitle, { color: colors.text }]}>Get started</Text>
              <Text style={[styles.setupDesc, { color: colors.textMuted }]}>
                Add a child profile, discover content, then assign videos they can watch safely.
              </Text>
              <View style={styles.setupSteps}>
                {SETUP_STEPS.map((step, index) => {
                  const done = index < setupStep;
                  const active = index === setupStep;
                  return (
                    <View key={step.key} style={styles.setupStep}>
                      <View
                        style={[
                          styles.setupStepIcon,
                          {
                            backgroundColor: done
                              ? colors.success + '22'
                              : active
                                ? colors.primary + '22'
                                : colors.border + '88',
                          },
                        ]}
                      >
                        <Icon
                          name={done ? 'checkmark' : step.icon}
                          size={16}
                          color={done ? colors.success : active ? colors.primary : colors.textMuted}
                        />
                      </View>
                      <Text
                        style={[
                          styles.setupStepLabel,
                          {
                            color: active ? colors.text : colors.textMuted,
                            fontWeight: active ? '600' : '500',
                          },
                        ]}
                      >
                        {step.label}
                      </Text>
                      {index < SETUP_STEPS.length - 1 && (
                        <View style={[styles.setupLine, { backgroundColor: colors.border }]} />
                      )}
                    </View>
                  );
                })}
              </View>
              <Pressable
                onPress={() =>
                  setupStep === 0
                    ? navigation.navigate('AddChild')
                    : goDiscover()
                }
                style={[styles.setupCta, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.setupCtaText}>
                  {setupStep === 0 ? 'Add your first child' : 'Browse content'}
                </Text>
                <Icon name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Compact 2×2 stats */}
        <Animated.View entering={FadeInDown.duration(420).delay(80)} style={[styles.section, styles.overviewSection]}>
          <SectionHeader title="Overview" />
          {loading ? (
            <StatsSkeleton />
          ) : (
            <View style={styles.statsGrid}>
              <StatCard compact icon="people" label="Children" value={stats.children} accent={colors.primary} />
              <StatCard compact icon="videocam" label="Assigned" value={stats.assignments} accent={colors.accentSecondary} />
              <StatCard compact icon="tv" label="Channels" value={stats.channels} accent={colors.accent} />
              <StatCard compact icon="library" label="Available" value={stats.videosAvailable} accent={colors.success} />
            </View>
          )}
        </Animated.View>

        {/* Content library */}
        <Animated.View entering={FadeInDown.duration(440).delay(100)} style={styles.section}>
          <SectionHeader
            title="Content library"
            actionLabel="View all"
            onAction={() => navigation.navigate('ParentLibrary')}
          />
          <Pressable
            onPress={() => navigation.navigate('ParentLibrary')}
            style={[styles.libraryBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.libraryIcon, { backgroundColor: colors.primary + '14' }]}>
              <Icon name="folder-open" size={22} color={colors.primary} />
            </View>
            <View style={styles.libraryText}>
              <Text style={[styles.libraryTitle, { color: colors.text }]}>Manage assigned content</Text>
              <Text style={[styles.libraryDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                Videos and channels you've added for your children
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </Animated.View>

        {/* Child overview */}
        {children.length > 0 && (
          <Animated.View entering={FadeInDown.duration(440).delay(120)} style={styles.section}>
            <SectionHeader
              title={t('child_profiles')}
              actionLabel={t('add_child')}
              onAction={() => navigation.navigate('AddChild')}
            />
            {children.slice(0, 3).map((child) => (
              <View key={child.id} style={styles.childCardWrap}>
                <ChildProfileCard
                  child={child}
                  compact
                  avatarKey={avatarByChildId[child.id] ?? (child.avatar as AvatarKey)}
                  assignmentCount={child.assignmentCount}
                  onPress={() => navigation.navigate('ChildProfileDetail', { childId: child.id })}
                />
              </View>
            ))}
          </Animated.View>
        )}

        {/* Recent activity */}
        {!loading && activityItems.length > 0 && (
          <Animated.View entering={FadeInDown.duration(440).delay(140)} style={styles.section}>
            <SectionHeader title="Recent Activity" />
            <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {activityItems.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.activityRow,
                    index < activityItems.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.activityIcon, { backgroundColor: item.color + '16' }]}>
                    <Icon name={item.icon} size={16} color={item.color} />
                  </View>
                  <Text style={[styles.activityText, { color: colors.text }]} numberOfLines={2}>
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Recently added */}
        <Animated.View entering={FadeInDown.duration(440).delay(160)} style={styles.section}>
          <SectionHeader title={t('recently_added')} actionLabel="Discover" onAction={goDiscover} />

          {loading ? (
            <VideoRowSkeleton />
          ) : recentVideos.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '12' }]}>
                <Icon name="film-outline" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No videos yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                Import in admin, then discover and assign content here.
              </Text>
              <Pressable
                onPress={goDiscover}
                style={[styles.emptyBtn, { borderColor: colors.primary }]}
              >
                <Text style={[styles.emptyBtnText, { color: colors.primary }]}>Go to Discover</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              horizontal
              data={recentVideos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <VideoCard
                  video={item}
                  horizontal
                  compact
                  onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.videoRow}
            />
          )}
        </Animated.View>
      </ScrollView>
      <ChildProfilePickerModal
        visible={childPickerVisible}
        children={apiChildren}
        activeChildId={activeChildId}
        selectOnly
        onClose={() => setChildPickerVisible(false)}
        onSelect={(id) => {
          setActiveChild(id);
          setChildPickerVisible(false);
        }}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {},
  childSwitchWrap: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  section: { marginBottom: spacing.lg },
  hero: {
    marginHorizontal: spacing.md,
    marginTop: 56,
    marginBottom: spacing.xs,
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroText: { flex: 1, paddingRight: spacing.sm },
  heroGreeting: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroName: {
    ...typography.h1,
    color: '#fff',
    marginBottom: 6,
  },
  heroSub: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  heroNotif: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPills: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  heroPillText: {
    ...typography.tiny,
    color: '#fff',
    fontWeight: '600',
  },
  quickActionsWrap: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  premiumIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumText: { flex: 1, minWidth: 0, gap: 2 },
  premiumTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumTitle: { ...typography.bodyBold, flexShrink: 1 },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  premiumDesc: { ...typography.caption, lineHeight: 17 },
  childCardWrap: {
    paddingHorizontal: spacing.md,
  },
  setupCard: {
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  setupTitle: { ...typography.h3, marginBottom: 4 },
  setupDesc: { ...typography.caption, lineHeight: 18, marginBottom: spacing.md },
  setupSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  setupStep: { flex: 1, alignItems: 'center', position: 'relative' },
  setupStepIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  setupStepLabel: { ...typography.tiny, textAlign: 'center' },
  setupLine: {
    position: 'absolute',
    top: 18,
    left: '58%',
    width: '84%',
    height: 2,
    zIndex: -1,
  },
  setupCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
  },
  setupCtaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  overviewSection: {
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  statSkeleton: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
  },
  libraryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  libraryIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryText: { flex: 1, minWidth: 0 },
  libraryTitle: { ...typography.bodyBold, marginBottom: 2 },
  libraryDesc: { ...typography.caption, lineHeight: 17 },
  childMeta: {
    ...typography.tiny,
    marginTop: -4,
    marginBottom: spacing.sm,
    marginLeft: spacing.md + 56 + spacing.md,
  },
  activityCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: { ...typography.caption, flex: 1, lineHeight: 18 },
  videoRow: { paddingHorizontal: spacing.md },
  videoSkeleton: { marginRight: spacing.md },
  emptyCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { ...typography.bodyBold, marginBottom: 4 },
  emptyDesc: { ...typography.caption, textAlign: 'center', lineHeight: 18, marginBottom: spacing.md },
  emptyBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  emptyBtnText: { fontWeight: '700', fontSize: 14 },
});
