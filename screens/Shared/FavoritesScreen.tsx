import React, { useMemo } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import VideoCard from '../../components/video/VideoCard';
import ChildChannelCard from '../../components/discover/ChildChannelCard';
import EmptyState from '../../components/ui/EmptyState';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { useChildLibrary } from '../../hooks/useChildLibrary';
import { useChildFavorites } from '../../hooks/useChildFavorites';
import { getFavorites } from '../../data/mockData';
import { normalizeCategory } from '../../utils/videoMapper';
import { useTabScreenPadding } from '../../hooks/useScreenPadding';
import { useAppInsets } from '../../hooks/useAppInsets';
import { spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import type { Video } from '../../types';
import { openChildVideo } from '../../utils/childVideoNavigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const role = useAppStore((s) => s.role);
  const activeChildId = useAppStore((s) => s.activeChildId);
  const videos = useAppStore((s) => s.videos);
  const toggleFavorite = useAppStore((s) => s.toggleVideoFavorite);
  const { videos: childVideos } = useChildLibrary(role === 'child' ? activeChildId : null);
  const {
    videoFavorites,
    favoriteChannels,
    toggleVideo,
    toggleChannel,
    loading,
  } = useChildFavorites(role === 'child' ? activeChildId : null);
  const { headerTop } = useAppInsets();
  const listBottomPad = useTabScreenPadding();

  const childFavoriteVideos = useMemo(() => {
    const byId = new Map(childVideos.map((v) => [v.id, v]));
    return videoFavorites
      .map((f) => {
        const fromLibrary = byId.get(f.video.id);
        if (fromLibrary) {
          return { ...fromLibrary, isFavorite: true };
        }
        if (!f.video.title) return null;
        return {
          id: f.video.id,
          title: f.video.title,
          thumbnail: f.video.thumbnailUrl ?? '',
          duration: '0:00',
          durationSeconds: 0,
          channelId: '',
          channelName: f.video.channelName,
          category: normalizeCategory(null),
          status: 'approved' as const,
          views: '0',
          publishedAt: '',
          isFavorite: true,
          watchProgress: 0,
        } satisfies Video;
      })
      .filter((v): v is Video => v !== null);
  }, [childVideos, videoFavorites]);

  const parentFavorites = useMemo(() => {
    const fromStore = videos.filter((v) => v.isFavorite && v.status === 'approved');
    return fromStore.length > 0 ? fromStore : getFavorites();
  }, [videos]);

  const isChild = role === 'child';
  const hasVideos = isChild ? childFavoriteVideos.length > 0 : parentFavorites.length > 0;
  const hasChannels = isChild && favoriteChannels.length > 0;
  const isEmpty = !loading && !hasVideos && !hasChannels;

  if (loading && isChild) {
    return (
      <GradientBackground variant="child">
        <ActivityIndicator style={{ marginTop: 120 }} color={colors.childPrimary} />
      </GradientBackground>
    );
  }

  if (isEmpty) {
    return (
      <GradientBackground variant={isChild ? 'child' : 'default'}>
        <EmptyState
          icon="heart-outline"
          title={t('no_favorites')}
          description={t('no_favorites_desc')}
        />
      </GradientBackground>
    );
  }

  if (isChild) {
    return (
      <GradientBackground variant="child">
        <Text style={[styles.title, { color: colors.text, paddingTop: headerTop }]}>
          {t('favorites')}
        </Text>
        <SectionList
          sections={[
            ...(hasChannels
              ? [{ title: t('favorite_channels'), data: favoriteChannels, type: 'channel' as const }]
              : []),
            ...(hasVideos
              ? [{ title: t('favorite_videos'), data: childFavoriteVideos, type: 'video' as const }]
              : []),
          ]}
          keyExtractor={(item, index) =>
            'id' in item && item.id ? item.id : `fav-${index}`
          }
          contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {section.title}
            </Text>
          )}
          renderItem={({ item, section }) =>
            section.type === 'channel' ? (
              <ChildChannelCard
                channel={item}
                onPress={() => navigation.navigate('ChildChannelDetail', { channelId: item.id })}
                onFavorite={() => void toggleChannel(item.id)}
                isFavorite
              />
            ) : (
              <VideoCard
                video={item}
                onPress={() => openChildVideo(navigation, { id: item.id, contentType: item.contentType })}
                onFavorite={() => void toggleVideo(item.id)}
              />
            )
          }
        />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="default">
      <Text style={[styles.title, { color: colors.text, paddingTop: headerTop }]}>{t('favorites')}</Text>
      <FlatList
        data={parentFavorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
            onFavorite={() => toggleFavorite(item.id)}
          />
        )}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  list: { paddingHorizontal: spacing.md },
});
