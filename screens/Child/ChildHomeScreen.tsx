import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import SectionHeader from '../../components/ui/SectionHeader';
import VideoCard from '../../components/video/VideoCard';
import ChildChannelCard from '../../components/discover/ChildChannelCard';
import ProfileAvatar from '../../components/profile/ProfileAvatar';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { useChildLibrary } from '../../hooks/useChildLibrary';
import { useChildWatchHistory } from '../../hooks/useChildWatchHistory';
import { useTabScreenPadding } from '../../hooks/useScreenPadding';
import { useAppInsets } from '../../hooks/useAppInsets';
import { formatDuration } from '../../api/browse';
import { normalizeCategory } from '../../utils/videoMapper';
import { spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import type { Video } from '../../types';
import type { WatchHistoryItem } from '../../api/watch';
import type { AvatarKey } from '../../constants/avatars';
import { getChildProfileMeta } from '../../services/childProfileMetaStorage';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function watchItemToVideo(item: WatchHistoryItem): Video {
  return {
    id: item.videoId,
    title: item.video.title,
    thumbnail: item.video.thumbnailUrl ?? '',
    duration: formatDuration(item.video.durationSecs),
    durationSeconds: item.video.durationSecs,
    channelId: '',
    channelName: item.video.channelName,
    category: normalizeCategory(item.video.category),
    status: 'approved',
    views: '0',
    publishedAt: item.watchedAt,
    isFavorite: false,
    watchProgress: item.progressPercent / 100,
  };
}

export default function ChildHomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const activeChildId = useAppStore((s) => s.activeChildId);
  const apiChildren = useAppStore((s) => s.apiChildren);
  const exitProfileMode = useAppStore((s) => s.exitProfileMode);
  const toggleFavorite = useAppStore((s) => s.toggleVideoFavorite);
  const { channels, feedVideos, hasContent, loading } = useChildLibrary(activeChildId);
  const { continueWatching, reload: reloadWatch } = useChildWatchHistory(activeChildId);
  const { headerTop } = useAppInsets();
  const scrollBottomPad = useTabScreenPadding();

  const [avatarKey, setAvatarKey] = useState<AvatarKey>('lion');

  const childName = useMemo(() => {
    const apiChild = apiChildren.find((c) => c.id === activeChildId);
    return apiChild?.user.displayName ?? t('home');
  }, [activeChildId, apiChildren, t]);

  useEffect(() => {
    if (!activeChildId) return;
    void getChildProfileMeta(activeChildId, 0).then((meta) => setAvatarKey(meta.avatarKey));
  }, [activeChildId]);

  useFocusEffect(
    React.useCallback(() => {
      void reloadWatch();
    }, [reloadWatch]),
  );

  const continueVideos = useMemo(() => continueWatching.map(watchItemToVideo), [continueWatching]);

  const switchProfile = () => {
    exitProfileMode();
    navigation.reset({ index: 0, routes: [{ name: 'ProfileSelection' }] });
  };

  const openChannel = (channelId: string) => {
    navigation.navigate('ChildChannelDetail', { channelId });
  };

  const openVideo = (videoId: string) => {
    navigation.navigate('VideoPlayer', { videoId });
  };

  return (
    <GradientBackground variant="child">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
      >
        <View style={[styles.header, { paddingTop: headerTop }]}>
          <View style={styles.headerLeft}>
            <ProfileAvatar avatarKey={avatarKey} size={48} />
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {t('learning_fun')}
              </Text>
              <Text style={[styles.name, { color: colors.text }]}>{childName}</Text>
            </View>
          </View>
          <Pressable onPress={switchProfile} style={[styles.switchBtn, { backgroundColor: colors.surface }]}>
            <Icon name="swap-horizontal" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {loading ? null : !hasContent ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('no_assigned_videos')}</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>{t('no_assigned_videos_desc')}</Text>
          </View>
        ) : (
          <>
            {continueVideos.length > 0 && (
              <>
                <SectionHeader title={t('continue_watching')} />
                <FlatList
                  horizontal
                  data={continueVideos}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <VideoCard
                      video={item}
                      horizontal
                      onPress={() => openVideo(item.id)}
                      onFavorite={() => toggleFavorite(item.id)}
                    />
                  )}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: spacing.md }}
                />
              </>
            )}

            {channels.length > 0 && (
              <>
                <SectionHeader title={t('my_channels')} />
                <FlatList
                  horizontal
                  data={channels}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <ChildChannelCard
                      channel={item}
                      compact
                      onPress={() => openChannel(item.id)}
                    />
                  )}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}
                />
              </>
            )}

            {feedVideos.length > 0 && (
              <>
                <SectionHeader title={t('for_you')} />
                {feedVideos.map((video) => (
                  <View key={video.id} style={{ paddingHorizontal: spacing.md }}>
                    <VideoCard
                      video={video}
                      onPress={() => openVideo(video.id)}
                      onFavorite={() => toggleFavorite(video.id)}
                    />
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
  scroll: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  greeting: { ...typography.caption },
  name: { ...typography.h2 },
  switchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.h3, textAlign: 'center' },
  emptyDesc: { ...typography.body, textAlign: 'center' },
});
