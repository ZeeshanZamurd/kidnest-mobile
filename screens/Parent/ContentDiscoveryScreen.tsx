import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
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
import DiscoverShelf from '../../components/discover/DiscoverShelf';
import {
  DISCOVER_GRID_GAP,
  DISCOVER_GUTTER,
  DISCOVER_SECTION_GAP,
  DISCOVER_STACK_GAP,
} from '../../components/discover/discoverLayout';
import { useTheme } from '../../context/ThemeContext';
import { radius, typography } from '../../theme/colors';
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

type Nav = NativeStackNavigationProp<RootStackParamList>;

type ChannelShelf = {
  channel: BrowseChannel;
  videos: BrowseVideo[];
};

type TabCacheEntry<T> = {
  key: string;
  data: T[];
  page: number;
  hasMore: boolean;
};

const PAGE_SIZE = 30;
const HOME_CHANNEL_SHELVES = 6;

export default function ContentDiscoveryScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { top: safeTop } = useAppInsets();
  const listBottomPad = useTabScreenPadding(24);
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

  const [tab, setTab] = useState<DiscoverTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const [videos, setVideos] = useState<BrowseVideo[]>([]);
  const [channels, setChannels] = useState<BrowseChannel[]>([]);
  const [homeLatest, setHomeLatest] = useState<BrowseVideo[]>([]);
  const [homeShorts, setHomeShorts] = useState<BrowseVideo[]>([]);
  const [homeChannels, setHomeChannels] = useState<BrowseChannel[]>([]);
  const [homeShelves, setHomeShelves] = useState<ChannelShelf[]>([]);
  const [homeReady, setHomeReady] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const tabCacheRef = useRef<{
    videos: TabCacheEntry<BrowseVideo> | null;
    shorts: TabCacheEntry<BrowseVideo> | null;
    channels: TabCacheEntry<BrowseChannel> | null;
  }>({ videos: null, shorts: null, channels: null });

  const hasFullVideoAccess = platformAccess?.hasFullVideoAccess ?? false;
  const hasPlatformAccess = platformAccess?.hasAccess ?? false;
  const freeUnlimitedBrowse = platformAccess?.freeUnlimitedBrowse ?? false;
  const canBrowseAllVideos =
    hasFullVideoAccess || hasPlatformAccess || freeUnlimitedBrowse;
  const freeMaxAssignments = platformAccess?.freeMaxAssignments ?? 10;
  const freeVideoLimit = platformAccess?.freeVideoBrowseLimit ?? 20;

  const hasActiveFilters = Boolean(
    debouncedSearch || selectedCategoryId || selectedLanguageId,
  );
  const showHome = tab === 'home' && !hasActiveFilters;
  const filterKey = `${debouncedSearch}|${selectedCategoryId ?? ''}|${selectedLanguageId ?? ''}`;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const loadHome = useCallback(async () => {
    setError('');
    if (!homeReady) setLoading(true);
    try {
      const [latestRes, shortsRes, channelsRes] = await Promise.all([
        browseVideos({ limit: 40, contentType: 'VIDEO' }),
        browseVideos({ limit: 24, contentType: 'SHORT' }),
        browseChannels({ limit: 20 }),
      ]);

      setHomeLatest(latestRes.data);
      setHomeShorts(shortsRes.data);
      setHomeChannels(channelsRes.data);
      prefetchBrowseThumbnails(latestRes.data, 0, 16);
      prefetchBrowseThumbnails(shortsRes.data, 0, 12);
      prefetchChannelThumbnails(channelsRes.data);
      setHomeReady(true);

      const shelfChannels = channelsRes.data
        .filter((ch) => (ch.videoCount ?? 0) > 0)
        .slice(0, HOME_CHANNEL_SHELVES);

      const shelves = await Promise.all(
        shelfChannels.map(async (channel) => {
          const res = await browseVideos({
            channelId: channel.id,
            contentType: 'VIDEO',
            limit: 12,
          });
          prefetchBrowseThumbnails(res.data, 0, 8);
          return { channel, videos: res.data };
        }),
      );

      setHomeShelves(shelves.filter((s) => s.videos.length > 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Discover');
    } finally {
      setLoading(false);
    }
  }, [homeReady]);

  const loadContent = useCallback(
    async (pageNum: number, append: boolean, activeTab: DiscoverTab) => {
      if (activeTab === 'home') return;

      const isMediaTab = activeTab === 'videos' || activeTab === 'shorts';
      if (isMediaTab && !canBrowseAllVideos && append) return;

      if (append) {
        setLoadingMore(true);
      } else {
        const cache = tabCacheRef.current[activeTab as 'videos' | 'shorts' | 'channels'];
        const hasCached = cache && cache.key === filterKey && cache.data.length > 0;
        if (!hasCached) setLoading(true);
      }
      setError('');
      try {
        const params = {
          search: debouncedSearch || undefined,
          categoryId: selectedCategoryId ?? undefined,
          languageId: selectedLanguageId ?? undefined,
          page: pageNum,
        };

        if (isMediaTab) {
          const res = await browseVideos({
            ...params,
            limit: PAGE_SIZE,
            contentType: activeTab === 'shorts' ? 'SHORT' : 'VIDEO',
          });
          setVideos((prev) => {
            const merged = append ? [...prev, ...res.data] : res.data;
            prefetchBrowseThumbnails(
              merged,
              append ? prev.length : 0,
              res.data.length + 4,
            );
            return merged;
          });
          const morePages = pageNum < res.meta.totalPages;
          const hasMoreNext = canBrowseAllVideos ? morePages : false;
          setHasMore(hasMoreNext);
          const prevCache = tabCacheRef.current[activeTab as 'videos' | 'shorts'];
          tabCacheRef.current[activeTab as 'videos' | 'shorts'] = {
            key: filterKey,
            data: append ? [...(prevCache?.data ?? []), ...res.data] : res.data,
            page: pageNum,
            hasMore: hasMoreNext,
          };
        } else {
          const res = await browseChannels({ ...params, limit: PAGE_SIZE });
          setChannels((prev) => {
            const next = append ? [...prev, ...res.data] : res.data;
            prefetchChannelThumbnails(next.slice(-PAGE_SIZE));
            return next;
          });
          const hasMoreNext = pageNum < res.meta.totalPages;
          setHasMore(hasMoreNext);
          tabCacheRef.current.channels = {
            key: filterKey,
            data: append
              ? [...(tabCacheRef.current.channels?.data ?? []), ...res.data]
              : res.data,
            page: pageNum,
            hasMore: hasMoreNext,
          };
        }
        setPage(pageNum);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load content';
        if (
          activeTab === 'channels' &&
          (msg.includes('subscription') || msg.includes('SUBSCRIPTION'))
        ) {
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
      canBrowseAllVideos,
      debouncedSearch,
      selectedCategoryId,
      selectedLanguageId,
      filterKey,
      navigation,
    ],
  );

  useEffect(() => {
    if (!showHome) return;
    if (homeReady) return;
    void loadHome();
  }, [showHome, homeReady, loadHome]);

  useEffect(() => {
    if (tab === 'home' && hasActiveFilters) {
      setTab('videos');
    }
  }, [tab, hasActiveFilters]);

  useEffect(() => {
    if (tab === 'home') return;

    const cacheKey = tab as 'videos' | 'shorts' | 'channels';
    const cached = tabCacheRef.current[cacheKey];
    if (cached && cached.key === filterKey) {
      if (cacheKey === 'channels') {
        setChannels(cached.data);
      } else {
        setVideos(cached.data);
      }
      setPage(cached.page);
      setHasMore(cached.hasMore);
      setLoading(false);
      return;
    }

    if (cacheKey === 'channels') setChannels([]);
    else setVideos([]);
    setPage(1);
    void loadContent(1, false, tab);
  }, [tab, filterKey, loadContent]);

  const isShortsGrid = tab === 'shorts';

  const handleTabChange = useCallback((next: DiscoverTab) => {
    setTab(next);
  }, []);

  const pinnedHeader = useMemo(
    () => (
      <View
        style={[
          styles.pinned,
          {
            paddingTop: safeTop + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.pinnedInner}>
          <DiscoverHeroHeader />
          {!pickerVisible ? (
            <SelectedChildBar
              children={apiChildren}
              activeChildId={activeChildId ?? apiChildren[0]?.id ?? null}
              onSelectChild={(id) => void confirmChild(id)}
              onOpenPicker={openPickerForSelect}
            />
          ) : null}
        </View>
      </View>
    ),
    [
      safeTop,
      colors.background,
      colors.border,
      pickerVisible,
      apiChildren,
      activeChildId,
      openPickerForSelect,
    ],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.chrome}>
        <View style={styles.sectionBlock}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search videos, shorts, channels…"
            compact
          />
        </View>

        <View style={styles.sectionBlock}>
          <DiscoverSegmentTabs value={tab} onChange={handleTabChange} />
        </View>

        {!showHome ? (
          <View style={styles.sectionBlock}>
            <DiscoverCompactFilters
              categories={categories}
              languages={languages}
              selectedCategoryId={selectedCategoryId}
              selectedLanguageId={selectedLanguageId}
              onCategoryChange={setSelectedCategoryId}
              onLanguageChange={setSelectedLanguageId}
            />
          </View>
        ) : null}

        {!canBrowseAllVideos && tab !== 'channels' && tab !== 'home' ? (
          <Pressable
            style={styles.freeHint}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={[styles.freeHintText, { color: colors.textMuted }]}>
              Free · {freeMaxAssignments} adds · {freeVideoLimit} browse
            </Text>
            <Icon name="chevron-forward" size={12} color={colors.textMuted} />
          </Pressable>
        ) : null}
        {!hasFullVideoAccess && tab === 'channels' ? (
          <Pressable
            style={styles.freeHint}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={[styles.freeHintText, { color: colors.textMuted }]}>
              Adding channels needs a subscription
            </Text>
            <Icon name="chevron-forward" size={12} color={colors.textMuted} />
          </Pressable>
        ) : null}

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.danger + '12' }]}>
            <Icon name="alert-circle" size={16} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.listSpacer} />
      </View>
    ),
    [
      searchQuery,
      tab,
      showHome,
      categories,
      languages,
      selectedCategoryId,
      selectedLanguageId,
      canBrowseAllVideos,
      hasFullVideoAccess,
      freeMaxAssignments,
      freeVideoLimit,
      error,
      colors.textMuted,
      colors.danger,
      navigation,
      handleTabChange,
    ],
  );

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || tab === 'home') return;
    void loadContent(page + 1, true, tab);
  }, [hasMore, loadContent, loadingMore, page, tab]);

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

  const homeBody = (
    <ScrollView
      contentContainerStyle={{ paddingBottom: listBottomPad }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.homeChrome}>{listHeader}</View>

      {loading && !homeReady ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <>
          <DiscoverShelf
            kind="videos"
            title="Latest videos"
            subtitle="Fresh uploads for kids"
            items={homeLatest}
            onPressItem={openVideo}
            onAddItem={handleAddVideo}
            getAssignState={(item) => getVideoAssignState(item.id, item.channelId)}
            isPremiumLocked={(item) => isVideoPremiumLocked(item, hasFullVideoAccess)}
            onSeeAll={() => setTab('videos')}
          />

          <DiscoverShelf
            kind="shorts"
            title="Shorts"
            items={homeShorts}
            onPressItem={openVideo}
            onAddItem={handleAddVideo}
            getAssignState={(item) => getVideoAssignState(item.id, item.channelId)}
            isPremiumLocked={(item) => isVideoPremiumLocked(item, hasFullVideoAccess)}
            onSeeAll={() => setTab('shorts')}
          />

          <DiscoverShelf
            kind="channels"
            title="Channels"
            subtitle="Browse by creator"
            items={homeChannels}
            onPressItem={openChannel}
            onAddItem={handleAddChannel}
            getAssignState={(item) => getChannelAssignState(item.id)}
            isPremiumLocked={(item) => isChannelPremiumLocked(item, hasFullVideoAccess)}
            onSeeAll={() => setTab('channels')}
          />

          {homeShelves.map(({ channel, videos: shelfVideos }) => (
            <DiscoverShelf
              key={channel.id}
              kind="videos"
              title={channel.title}
              subtitle="Playlist-style picks"
              items={shelfVideos}
              onPressItem={openVideo}
              onAddItem={handleAddVideo}
              getAssignState={(item) => getVideoAssignState(item.id, item.channelId)}
              isPremiumLocked={(item) => isVideoPremiumLocked(item, hasFullVideoAccess)}
              onSeeAll={() => openChannel(channel)}
            />
          ))}

          {!loading &&
          homeLatest.length === 0 &&
          homeShorts.length === 0 &&
          homeChannels.length === 0 ? (
            <View style={styles.emptyPad}>
              <EmptyState
                icon="videocam-off"
                title="No content yet"
                description="Imported videos will show up here."
              />
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );

  const showListSpinner =
    loading &&
    ((tab === 'channels' && channels.length === 0) ||
      ((tab === 'videos' || tab === 'shorts') && videos.length === 0));

  return (
    <GradientBackground variant="subtle">
      <View style={styles.screen}>
        {pinnedHeader}
        <View style={styles.body}>
          {showHome ? (
            homeBody
          ) : showListSpinner ? (
            <View style={styles.contentRail}>
              {listHeader}
              <ActivityIndicator style={styles.loader} color={colors.primary} />
            </View>
          ) : tab === 'channels' ? (
            channels.length === 0 ? (
              <View style={styles.contentRail}>
                {listHeader}
                <EmptyState
                  icon="search"
                  title="No channels found"
                  description="Try different filters or search terms."
                />
              </View>
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
                initialNumToRender={8}
              />
            )
          ) : videos.length === 0 ? (
            <View style={styles.contentRail}>
              {listHeader}
              <EmptyState
                icon={tab === 'shorts' ? 'flash-off' : 'videocam-off'}
                title={tab === 'shorts' ? 'No shorts found' : 'No videos found'}
                description="Try different filters or search terms."
              />
            </View>
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
              initialNumToRender={8}
            />
          )}
        </View>
      </View>
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
  screen: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  pinned: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 2,
  },
  pinnedInner: {
    paddingHorizontal: DISCOVER_GUTTER,
    paddingBottom: 10,
    gap: DISCOVER_STACK_GAP,
  },
  chrome: {
    paddingTop: DISCOVER_STACK_GAP,
    paddingBottom: 0,
  },
  homeChrome: {
    paddingBottom: 4,
    paddingHorizontal: DISCOVER_GUTTER,
  },
  contentRail: {
    flex: 1,
    paddingHorizontal: DISCOVER_GUTTER,
  },
  sectionBlock: {
    marginBottom: DISCOVER_STACK_GAP,
  },
  listSpacer: {
    height: DISCOVER_SECTION_GAP - DISCOVER_STACK_GAP,
  },
  freeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: DISCOVER_STACK_GAP,
    marginTop: -4,
  },
  freeHintText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: DISCOVER_STACK_GAP,
    padding: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: '500' },
  list: {
    paddingHorizontal: DISCOVER_GUTTER,
  },
  gridRow: {
    justifyContent: 'space-between',
    columnGap: DISCOVER_GRID_GAP,
  },
  loader: { marginTop: 48 },
  emptyPad: {
    paddingHorizontal: DISCOVER_GUTTER,
    paddingTop: 24,
  },
  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  gateTitle: { ...typography.h2, textAlign: 'center' },
  gateText: { ...typography.body, textAlign: 'center', lineHeight: 22 },
  gateBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.xl,
    marginTop: 8,
  },
  gateBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
