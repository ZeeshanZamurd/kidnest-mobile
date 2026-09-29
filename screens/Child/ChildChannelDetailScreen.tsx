import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import EmptyState from '../../components/ui/EmptyState';
import { ChannelDetailSkeleton } from '../../components/child/ChildScreenSkeletons';
import { ChildLoadError } from '../../components/child/ChildLoadFeedback';
import ContentTypeSegment, {
  type MediaFilter,
} from '../../components/discover/ContentTypeSegment';
import DiscoverMediaCard from '../../components/discover/DiscoverMediaCard';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { useChildFavorites } from '../../hooks/useChildFavorites';
import { useAppStore } from '../../store/useAppStore';
import { spacing, typography, radius } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import {
  browseVideos,
  fetchChannelById,
  shortDescription,
  type BrowseVideo,
  type ChannelDetail,
} from '../../api/browse';
import { openChildVideo } from '../../utils/childVideoNavigation';
import CachedImage from '../../components/ui/CachedImage';
import {
  prefetchBrowseThumbnails,
} from '../../services/cache';

type Route = RouteProp<RootStackParamList, 'ChildChannelDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const PAGE_SIZE = 24;

function mergeVideos(prev: BrowseVideo[], next: BrowseVideo[]): BrowseVideo[] {
  if (prev.length === 0) return next;
  const seen = new Set(prev.map((v) => v.id));
  const appended = next.filter((v) => !seen.has(v.id));
  return appended.length === 0 ? prev : [...prev, ...appended];
}

export default function ChildChannelDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { channelId } = route.params;
  const activeChildId = useAppStore((s) => s.activeChildId);
  const { isChannelFavorite, toggleChannel } = useChildFavorites(activeChildId);

  const { headerTop } = useAppInsets();
  const listBottomPad = useStackScreenPadding();

  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [items, setItems] = useState<BrowseVideo[]>([]);
  const [filter, setFilter] = useState<MediaFilter>('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const loadingMoreLock = useRef(false);

  useEffect(() => {
    setLoading(true);
    void fetchChannelById(channelId)
      .then(setChannel)
      .catch((err) => setError(err instanceof Error ? err.message : 'Channel not found'))
      .finally(() => setLoading(false));
  }, [channelId]);

  const loadMedia = useCallback(async (pageNum: number, append: boolean) => {
    if (append) {
      if (loadingMoreLock.current) return;
      loadingMoreLock.current = true;
      setLoadingMore(true);
    } else {
      setLoadingMedia(true);
    }
    setError('');
    try {
      const contentType =
        filter === 'ALL' ? undefined : (filter as 'VIDEO' | 'SHORT');
      const res = await browseVideos({
        channelId,
        contentType,
        page: pageNum,
        limit: PAGE_SIZE,
      });
      setItems((prev) => {
        const next = append ? mergeVideos(prev, res.data) : res.data;
        prefetchBrowseThumbnails(
          next,
          append ? prev.length : 0,
          append ? res.data.length + 4 : 12,
        );
        return next;
      });
      setPage(pageNum);
      setHasMore(pageNum < res.meta.totalPages && res.data.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoadingMedia(false);
      setLoadingMore(false);
      loadingMoreLock.current = false;
    }
  }, [channelId, filter]);

  useEffect(() => {
    if (!channel) return;
    setItems([]);
    setPage(1);
    setHasMore(true);
    void loadMedia(1, false);
  }, [channel, loadMedia]);

  const loadMore = useCallback(() => {
    if (loadingMedia || loadingMore || !hasMore || items.length === 0) return;
    void loadMedia(page + 1, true);
  }, [hasMore, items.length, loadMedia, loadingMedia, loadingMore, page]);

  const openVideo = (item: BrowseVideo) => {
    openChildVideo(
      navigation,
      {
        id: item.id,
        contentType: item.contentType,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl,
      },
      { channelId },
    );
  };

  const showGrid =
    filter === 'SHORT' || (filter === 'ALL' && items.every((i) => i.contentType === 'SHORT'));

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const idx = viewableItems[viewableItems.length - 1]?.index;
      if (idx != null) prefetchBrowseThumbnails(items, idx + 1, 8);
    },
    [items],
  );

  const listFooter = useMemo(
    () =>
      loadingMore ? (
        <ActivityIndicator color={colors.primary} style={styles.loadMore} />
      ) : null,
    [colors.primary, loadingMore],
  );

  if (loading) {
    return (
      <GradientBackground variant="child">
        <View style={{ paddingTop: headerTop }}>
          <ChannelDetailSkeleton />
        </View>
      </GradientBackground>
    );
  }

  if (!channel) {
    return (
      <GradientBackground variant="child">
        <ChildLoadError
          title={t('child_load_error')}
          description={error || t('child_load_error_desc')}
          retryLabel={t('try_again')}
          onRetry={() => {
            setLoading(true);
            void fetchChannelById(channelId)
              .then(setChannel)
              .catch((err) => setError(err instanceof Error ? err.message : 'Channel not found'))
              .finally(() => setLoading(false));
          }}
        />
      </GradientBackground>
    );
  }

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={[styles.topBar, { paddingTop: headerTop }]}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.channelRow, { borderBottomColor: colors.border }]}>
        <CachedImage uri={channel.thumbnailUrl} style={styles.channelAvatar} />
        <View style={styles.channelMeta}>
          <Text style={[styles.channelTitle, { color: colors.text }]} numberOfLines={2}>
            {channel.title}
          </Text>
          <Text style={[styles.channelStats, { color: colors.textMuted }]}>
            {channel.videoCount} videos · {channel.shortCount} shorts
          </Text>
          {channel.description ? (
            <Text style={[styles.channelDesc, { color: colors.textMuted }]} numberOfLines={2}>
              {shortDescription(channel.description, 120)}
            </Text>
          ) : null}
        </View>
        <Pressable
          style={[styles.favBtn, { backgroundColor: colors.surface }]}
          onPress={() => void toggleChannel(channelId)}
          hitSlop={6}
        >
          <Icon
            name={isChannelFavorite(channelId) ? 'heart' : 'heart-outline'}
            size={22}
            color={isChannelFavorite(channelId) ? colors.accent : colors.textMuted}
          />
        </Pressable>
      </View>

      <ContentTypeSegment value={filter} onChange={setFilter} compact />

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      {loadingMedia && items.length === 0 ? (
        <ChannelDetailSkeleton />
      ) : null}
    </View>
  );

  return (
    <GradientBackground variant="child">
      <FlashList
        key={showGrid ? 'grid' : 'list'}
        data={items}
        numColumns={showGrid ? 2 : 1}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <DiscoverMediaCard
            item={item}
            variant={showGrid ? 'grid' : 'list'}
            onPress={() => openVideo(item)}
          />
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.45}
        ListEmptyComponent={
          loadingMedia ? null : error ? (
            <ChildLoadError
              title={t('child_load_error')}
              description={error}
              retryLabel={t('try_again')}
              onRetry={() => void loadMedia(1, false)}
            />
          ) : (
            <EmptyState
              icon="videocam-off"
              title={t('no_assigned_videos')}
              description={t('no_assigned_videos_desc')}
            />
          )
        }
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    paddingBottom: spacing.sm,
  },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  channelAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  channelMeta: {
    flex: 1,
    gap: 2,
    paddingTop: 2,
  },
  channelTitle: {
    ...typography.bodyBold,
    fontSize: 16,
  },
  channelStats: {
    ...typography.caption,
    fontSize: 12,
  },
  channelDesc: {
    ...typography.caption,
    lineHeight: 18,
    marginTop: 2,
  },
  favBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  mediaLoader: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  loadMore: {
    marginVertical: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  error: {
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
