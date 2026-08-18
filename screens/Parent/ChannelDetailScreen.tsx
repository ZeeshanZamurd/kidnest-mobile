import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import EmptyState from '../../components/ui/EmptyState';
import ContentTypeSegment, {
  type MediaFilter,
} from '../../components/discover/ContentTypeSegment';
import DiscoverMediaCard from '../../components/discover/DiscoverMediaCard';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { spacing, typography, radius } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import {
  browseVideos,
  fetchChannelById,
  shortDescription,
  type BrowseVideo,
  type ChannelDetail,
} from '../../api/browse';
import { useAssignToChild } from '../../hooks/useAssignToChild';
import AssignActionButton from '../../components/discover/AssignActionButton';
import ChildProfilePickerModal from '../../components/profile/ChildProfilePickerModal';
import SelectedChildBar from '../../components/profile/SelectedChildBar';
import PremiumContentBadge from '../../components/ui/PremiumContentBadge';
import { useAppStore } from '../../store/useAppStore';
import {
  isChannelPremiumLocked,
  isVideoPremiumLocked,
} from '../../utils/premiumAccess';
import { promptPremiumSubscribe } from '../../utils/premiumPrompt';
import CachedImage from '../../components/ui/CachedImage';
import { prefetchBrowseThumbnails } from '../../services/cache';

type Route = RouteProp<RootStackParamList, 'ChannelDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ChannelDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { channelId } = route.params;

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
  const { headerTop } = useAppInsets();
  const listBottomPad = useStackScreenPadding();
  const platformAccess = useAppStore((s) => s.platformAccess);
  const hasFullVideoAccess = platformAccess?.hasFullVideoAccess ?? false;

  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [items, setItems] = useState<BrowseVideo[]>([]);
  const [filter, setFilter] = useState<MediaFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    void fetchChannelById(channelId)
      .then(setChannel)
      .catch((err) => setError(err instanceof Error ? err.message : 'Channel not found'))
      .finally(() => setLoading(false));
  }, [channelId]);

  const loadMedia = useCallback(async () => {
    setLoadingMedia(true);
    setError('');
    try {
      const contentType = filter === 'ALL' ? undefined : (filter as 'VIDEO' | 'SHORT');
      const res = await browseVideos({ channelId, contentType, limit: 50 });
      setItems(res.data);
      prefetchBrowseThumbnails(res.data, 0, 12);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoadingMedia(false);
    }
  }, [channelId, filter]);

  useEffect(() => {
    if (!channel) return;
    void loadMedia();
  }, [channel, loadMedia]);

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

  const handleToggleVideo = useCallback(
    (video: BrowseVideo) => {
      if (isVideoPremiumLocked(video, hasFullVideoAccess)) {
        promptPremiumSubscribe(navigation);
        return;
      }
      requestToggleVideo(video);
    },
    [hasFullVideoAccess, navigation, requestToggleVideo],
  );

  const channelLocked =
    channel != null && isChannelPremiumLocked(channel, hasFullVideoAccess);

  const showGrid =
    filter === 'SHORT' || (filter === 'ALL' && items.every((i) => i.contentType === 'SHORT'));

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const idx = viewableItems[viewableItems.length - 1]?.index;
      if (idx != null) prefetchBrowseThumbnails(items, idx + 1, 8);
    },
    [items],
  );

  const renderVideoItem = useCallback(
    ({ item }: { item: BrowseVideo }) => (
      <DiscoverMediaCard
        item={item}
        variant={showGrid ? 'grid' : 'list'}
        premiumLocked={isVideoPremiumLocked(item, hasFullVideoAccess)}
        onPress={() => openVideo(item)}
        onAdd={() => handleToggleVideo(item)}
        assignState={getVideoAssignState(item.id, item.channelId)}
      />
    ),
    [getVideoAssignState, handleToggleVideo, hasFullVideoAccess, openVideo, showGrid],
  );

  const listHeader = useMemo(() => {
    if (!channel) return null;

    return (
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
                {shortDescription(channel.description, 100)}
              </Text>
            ) : null}
            {channelLocked ? (
              <View style={styles.premiumRow}>
                <PremiumContentBadge compact />
              </View>
            ) : null}
          </View>
          {!channelLocked ? (
            <AssignActionButton
              state={getChannelAssignState(channel.id)}
              onPress={() => requestToggleChannel(channel)}
              variant="inline"
            />
          ) : null}
        </View>

        {!pickerVisible ? (
          <View style={styles.childBarWrap}>
            <SelectedChildBar
              children={apiChildren}
              activeChildId={activeChildId ?? apiChildren[0]?.id ?? null}
              onPress={openPickerForSelect}
            />
          </View>
        ) : null}

        {channelLocked ? (
          <Pressable
            style={[styles.premiumCta, { backgroundColor: colors.primary }]}
            onPress={() =>
              promptPremiumSubscribe(
                navigation,
                t('premium_channel_title', 'Premium channel'),
                t(
                  'premium_channel_add_desc',
                  'Subscribe to add this channel for your child.',
                ),
              )
            }
          >
            <Icon name="diamond" size={14} color="#fff" />
            <Text style={styles.premiumCtaText}>
              {t('subscribe_to_unlock', 'Subscribe to unlock')}
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.segmentWrap}>
          <ContentTypeSegment value={filter} onChange={setFilter} compact />
        </View>

        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        {loadingMedia && items.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.mediaLoader} />
        ) : null}
      </View>
    );
  }, [
    activeChildId,
    apiChildren,
    channel,
    channelLocked,
    colors.border,
    colors.danger,
    colors.primary,
    colors.surface,
    colors.text,
    colors.textMuted,
    error,
    filter,
    getChannelAssignState,
    headerTop,
    items.length,
    loadingMedia,
    navigation,
    openPickerForSelect,
    pickerVisible,
    requestToggleChannel,
    t,
  ]);

  const listEmpty = useMemo(() => {
    if (loadingMedia) return null;
    return (
      <EmptyState
        icon="videocam-off"
        title="No content yet"
        description={
          filter === 'SHORT'
            ? 'This channel has no shorts.'
            : filter === 'VIDEO'
              ? 'This channel has no videos.'
              : 'Nothing published in this channel yet.'
        }
      />
    );
  }, [filter, loadingMedia]);

  if (loading) {
    return (
      <GradientBackground variant="subtle">
        <ActivityIndicator style={{ marginTop: 120 }} color={colors.primary} />
      </GradientBackground>
    );
  }

  if (!channel) {
    return (
      <GradientBackground variant="subtle">
        <EmptyState
          icon="alert-circle"
          title="Channel not found"
          description={error || 'Try again later.'}
        />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="subtle">
      <FlatList
        key={showGrid ? 'grid' : 'list'}
        data={items}
        numColumns={showGrid ? 2 : 1}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        columnWrapperStyle={showGrid ? styles.gridRow : undefined}
        renderItem={renderVideoItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
        ListEmptyComponent={listEmpty}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
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
  listHeader: {
    paddingBottom: spacing.sm,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
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
    paddingHorizontal: spacing.lg,
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
  premiumRow: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  childBarWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  premiumCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  premiumCtaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  segmentWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  mediaLoader: {
    marginVertical: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  error: {
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
