import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTabScreenPadding } from '../../hooks/useScreenPadding';
import { useAppInsets } from '../../hooks/useAppInsets';
import GradientBackground from '../../components/ui/GradientBackground';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import DiscoverMediaCard from '../../components/discover/DiscoverMediaCard';
import DiscoverChannelCard from '../../components/discover/DiscoverChannelCard';
import DiscoverHeroHeader from '../../components/discover/DiscoverHeroHeader';
import DiscoverSegmentTabs, { type DiscoverTab } from '../../components/discover/DiscoverSegmentTabs';
import DiscoverCompactFilters from '../../components/discover/DiscoverCompactFilters';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import {
  browseChannels,
  browseVideos,
  fetchCategories,
  fetchLanguages,
  type BrowseChannel,
  type BrowseVideo,
  type Category,
  type Language,
} from '../../api/browse';
import { fetchPlatformAccess } from '../../api/parent';
import { useAppStore } from '../../store/useAppStore';
import { useAssignToChild } from '../../hooks/useAssignToChild';
import ChildProfilePickerModal from '../../components/profile/ChildProfilePickerModal';
import SelectedChildBar from '../../components/profile/SelectedChildBar';
import {
  isChannelPremiumLocked,
  isVideoPremiumLocked,
} from '../../utils/premiumAccess';
import { promptPremiumSubscribe } from '../../utils/premiumPrompt';
import {
  prefetchBrowseThumbnails,
  prefetchChannelThumbnails,
} from '../../services/cache';
import { SHORT_COL_W } from '../../components/discover/DiscoverMediaCard';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ContentDiscoveryScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { top: safeTop } = useAppInsets();
  const listBottomPad = useTabScreenPadding();
  const platformAccess = useAppStore((s) => s.platformAccess);
  const setPlatformAccess = useAppStore((s) => s.setPlatformAccess);
  const parentSession = useAppStore((s) => s.parentSession);

  const {
    apiChildren,
    activeChildId,
    pickerVisible,
    pickerLoading,
    assigningChildId,
    pickerSelectOnly,
    openPickerForSelect,
    requestToggleVideo,
    requestToggleChannel,
    getVideoAssignState,
    getChannelAssignState,
    confirmChild,
    closePicker,
  } = useAssignToChild();

  const [tab, setTab] = useState<DiscoverTab>('videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const [videos, setVideos] = useState<BrowseVideo[]>([]);
  const [channels, setChannels] = useState<BrowseChannel[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const hasFullVideoAccess =
    platformAccess?.hasFullVideoAccess ?? false;
  const freeMaxAssignments = platformAccess?.freeMaxAssignments ?? 10;
  const freeVideoLimit = platformAccess?.freeVideoBrowseLimit ?? 20;

  useEffect(() => {
    if (platformAccess || !parentSession?.idToken) return;
    void fetchPlatformAccess()
      .then(setPlatformAccess)
      .catch(() => {});
  }, [platformAccess, parentSession?.idToken, setPlatformAccess]);

  useEffect(() => {
    void Promise.all([fetchCategories(), fetchLanguages()])
      .then(([cats, langs]) => {
        setCategories(cats);
        setLanguages(langs);
      })
      .catch(() => {});
  }, []);

  const openVideo = useCallback(
    (video: BrowseVideo) => {
      if (isVideoPremiumLocked(video, hasFullVideoAccess)) {
        promptPremiumSubscribe(navigation);
        return;
      }
      navigation.navigate('VideoPlayer', { videoId: video.id });
    },
    [hasFullVideoAccess, navigation],
  );

  const openChannelById = useCallback(
    (channelId: string, hints?: { isPremium?: boolean }) => {
      if (isChannelPremiumLocked(hints ?? {}, hasFullVideoAccess)) {
        promptPremiumSubscribe(
          navigation,
          'Premium channel',
          'Subscribe to browse this channel and add it for your child.',
        );
        return;
      }
      navigation.navigate('ChannelDetail', { channelId });
    },
    [hasFullVideoAccess, navigation],
  );

  const openChannel = useCallback(
    (channel: BrowseChannel) => {
      openChannelById(channel.id, { isPremium: channel.isPremium });
    },
    [openChannelById],
  );

  const handleAddVideo = useCallback(
    (video: BrowseVideo) => {
      if (isVideoPremiumLocked(video, hasFullVideoAccess)) {
        promptPremiumSubscribe(navigation);
        return;
      }
      requestToggleVideo(video);
    },
    [hasFullVideoAccess, navigation, requestToggleVideo],
  );

  const handleAddChannel = useCallback(
    (channel: BrowseChannel) => {
      if (!hasFullVideoAccess) {
        promptPremiumSubscribe(
          navigation,
          'Subscribe for channels',
          'Free plan includes up to 10 individual videos. Subscribe to add whole channels.',
        );
        return;
      }
      if (isChannelPremiumLocked(channel, hasFullVideoAccess)) {
        promptPremiumSubscribe(
          navigation,
          'Premium channel',
          'Subscribe to add this channel for your child.',
        );
        return;
      }
      requestToggleChannel(channel);
    },
    [hasFullVideoAccess, navigation, requestToggleChannel],
  );

  const loadContent = useCallback(
    async (pageNum: number, append: boolean) => {
      const isMediaTab = tab === 'videos' || tab === 'shorts';
      if (isMediaTab && !hasFullVideoAccess && append) return;

      if (append) setLoadingMore(true);
      else setLoading(true);
      setError('');
      try {
        const pageSize = 20;
        const params = {
          search: searchQuery || undefined,
          categoryId: selectedCategoryId ?? undefined,
          languageId: selectedLanguageId ?? undefined,
          page: pageNum,
        };

        if (isMediaTab) {
          const res = await browseVideos({
            ...params,
            limit: pageSize,
            contentType: tab === 'shorts' ? 'SHORT' : 'VIDEO',
          });
          setVideos((prev) => {
            const next = append ? [...prev, ...res.data] : res.data;
            prefetchBrowseThumbnails(
              next,
              append ? prev.length : 0,
              res.data.length + 4,
            );
            return next;
          });
          if (hasFullVideoAccess && pageNum < res.meta.totalPages) {
            void browseVideos({
              ...params,
              limit: pageSize,
              page: pageNum + 1,
              contentType: tab === 'shorts' ? 'SHORT' : 'VIDEO',
            });
          }
          setHasMore(hasFullVideoAccess && pageNum < res.meta.totalPages);
        } else {
          const res = await browseChannels({ ...params, limit: pageSize });
          setChannels((prev) => {
            const next = append ? [...prev, ...res.data] : res.data;
            prefetchChannelThumbnails(next.slice(-pageSize));
            return next;
          });
          setHasMore(pageNum < res.meta.totalPages);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load content';
        if (tab === 'channels' && (msg.includes('subscription') || msg.includes('SUBSCRIPTION'))) {
          navigation.navigate('Subscription');
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      tab,
      searchQuery,
      selectedCategoryId,
      selectedLanguageId,
      hasFullVideoAccess,
      navigation,
    ],
  );

  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => void loadContent(1, false), 300);
    return () => clearTimeout(timer);
  }, [loadContent]);

  const isShortsGrid = tab === 'shorts';

  const listHeader = useMemo(
    () => (
      <>
        <View style={[styles.header, { paddingTop: safeTop + 8 }]}>
          <DiscoverHeroHeader />
          {!pickerVisible ? (
            <SelectedChildBar
              children={apiChildren}
              activeChildId={activeChildId ?? apiChildren[0]?.id ?? null}
              onPress={openPickerForSelect}
            />
          ) : null}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search videos, shorts, or channels..."
            compact
          />
          <DiscoverSegmentTabs value={tab} onChange={setTab} />
          <DiscoverCompactFilters
            categories={categories}
            languages={languages}
            selectedCategoryId={selectedCategoryId}
            selectedLanguageId={selectedLanguageId}
            onCategoryChange={setSelectedCategoryId}
            onLanguageChange={setSelectedLanguageId}
          />
          {!hasFullVideoAccess && tab !== 'channels' ? (
            <Pressable
              style={styles.freeHint}
              onPress={() => navigation.navigate('Subscription')}
            >
              <Icon name="sparkles" size={13} color={colors.primary} />
              <Text style={[styles.freeHintText, { color: colors.textMuted }]}>
                Free: add up to {freeMaxAssignments} videos · {freeVideoLimit} browse · subscribe for channels
              </Text>
              <Icon name="chevron-forward" size={12} color={colors.primary} />
            </Pressable>
          ) : null}
          {!hasFullVideoAccess && tab === 'channels' ? (
            <Pressable
              style={styles.freeHint}
              onPress={() => navigation.navigate('Subscription')}
            >
              <Icon name="albums-outline" size={13} color={colors.primary} />
              <Text style={[styles.freeHintText, { color: colors.textMuted }]}>
                Channels require a subscription · free plan includes {freeMaxAssignments} individual videos
              </Text>
              <Icon name="chevron-forward" size={12} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.danger + '12' }]}>
            <Icon name="alert-circle" size={16} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : null}
      </>
    ),
    [
      safeTop,
      pickerVisible,
      apiChildren,
      activeChildId,
      openPickerForSelect,
      searchQuery,
      tab,
      categories,
      languages,
      selectedCategoryId,
      selectedLanguageId,
      hasFullVideoAccess,
      freeMaxAssignments,
      freeVideoLimit,
      error,
      colors.primary,
      colors.textMuted,
      colors.danger,
      navigation,
    ],
  );

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    void loadContent(next, true);
  }, [hasMore, loadContent, loadingMore, page]);

  const renderChannelItem = useCallback(
    ({ item }: { item: BrowseChannel }) => (
      <DiscoverChannelCard
        channel={item}
        premiumLocked={isChannelPremiumLocked(item, hasFullVideoAccess)}
        onPress={() => openChannel(item)}
        onAdd={() => handleAddChannel(item)}
        assignState={getChannelAssignState(item.id)}
      />
    ),
    [getChannelAssignState, handleAddChannel, hasFullVideoAccess, openChannel],
  );

  const renderVideoItem = useCallback(
    ({ item }: { item: BrowseVideo }) => (
      <DiscoverMediaCard
        item={item}
        layout={isShortsGrid ? 'short' : 'video'}
        premiumLocked={isVideoPremiumLocked(item, hasFullVideoAccess)}
        onPress={() => openVideo(item)}
        onChannelPress={() => openChannelById(item.channelId, { isPremium: item.isPremium })}
        onAdd={() => handleAddVideo(item)}
        assignState={getVideoAssignState(item.id, item.channelId)}
      />
    ),
    [
      getVideoAssignState,
      handleAddVideo,
      hasFullVideoAccess,
      isShortsGrid,
      openChannelById,
      openVideo,
    ],
  );

  const listFooter = useMemo(
    () =>
      loadingMore ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : null,
    [colors.primary, loadingMore],
  );

  return (
    <GradientBackground variant="subtle">
      {loading && videos.length === 0 && channels.length === 0 ? (
        <>
          {listHeader}
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        </>
      ) : tab === 'channels' ? (
        channels.length === 0 ? (
          <>
            {listHeader}
            <EmptyState icon="search" title="No channels found" description="Try different filters or search terms." />
          </>
        ) : (
          <FlatList
            data={channels}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={listHeader}
            contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
            renderItem={renderChannelItem}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={listFooter}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews
          />
        )
      ) : videos.length === 0 ? (
        <>
          {listHeader}
          <EmptyState
            icon={tab === 'shorts' ? 'flash-off' : 'videocam-off'}
            title={tab === 'shorts' ? 'No shorts found' : 'No videos found'}
            description="Try different filters or search terms."
          />
        </>
      ) : (
        <FlatList
          key={isShortsGrid ? 'shorts-grid' : 'videos-list'}
          data={videos}
          numColumns={isShortsGrid ? 2 : 1}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
          columnWrapperStyle={isShortsGrid ? styles.gridRow : undefined}
          renderItem={renderVideoItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={listFooter}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
        />
      )}
      <ChildProfilePickerModal
        visible={pickerVisible}
        children={apiChildren}
        loading={pickerLoading}
        assigningChildId={assigningChildId}
        activeChildId={activeChildId}
        selectOnly={pickerSelectOnly}
        onClose={closePicker}
        onSelect={(id) => void confirmChild(id)}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 4,
    gap: 10,
  },
  freeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    marginTop: -2,
  },
  freeHintText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: '500' },
  list: { paddingHorizontal: spacing.lg },
  gridRow: {
    justifyContent: 'space-between',
  },
  loader: { marginTop: 48 },
  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  gateTitle: { ...typography.h2, textAlign: 'center' },
  gateText: { ...typography.body, textAlign: 'center', lineHeight: 22 },
  gateBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.xl, marginTop: spacing.sm },
  gateBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
