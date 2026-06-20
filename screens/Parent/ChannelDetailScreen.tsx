import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
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
import { assignVideo } from '../../api/assignments';
import { useAppStore } from '../../store/useAppStore';

type Route = RouteProp<RootStackParamList, 'ChannelDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ChannelDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { channelId } = route.params;

  const activeChildId = useAppStore((s) => s.activeChildId);
  const apiChildren = useAppStore((s) => s.apiChildren);
  const childId = activeChildId ?? apiChildren[0]?.id ?? null;
  const { headerTop } = useAppInsets();
  const listBottomPad = useStackScreenPadding();

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
      const contentType =
        filter === 'ALL' ? undefined : (filter as 'VIDEO' | 'SHORT');
      const res = await browseVideos({ channelId, contentType, limit: 50 });
      setItems(res.data);
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

  const openVideo = (videoId: string) => {
    navigation.navigate('VideoPlayer', { videoId });
  };

  const handleAdd = async (video: BrowseVideo) => {
    if (!childId) {
      Alert.alert('Select a child', 'Choose a child profile first.');
      navigation.navigate('ParentLibrary');
      return;
    }
    try {
      await assignVideo(childId, video.id);
      Alert.alert('Added', `"${video.title}" added for your child.`);
    } catch (err) {
      Alert.alert('Could not add', err instanceof Error ? err.message : 'Try again');
    }
  };

  const showGrid = filter === 'SHORT' || (filter === 'ALL' && items.every((i) => i.contentType === 'SHORT'));

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
        <EmptyState icon="alert-circle" title="Channel not found" description={error || 'Try again later.'} />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="subtle">
      <View style={[styles.header, { paddingTop: headerTop }]}>
        <Pressable style={[styles.backBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.hero, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <LinearGradient
          colors={[colors.primary + '28', colors.accent + '14', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
        <Image source={{ uri: channel.thumbnailUrl ?? '' }} style={styles.heroAvatar} />
        <Text style={[styles.heroTitle, { color: colors.text }]}>{channel.title}</Text>
        <View style={styles.heroStats}>
          <View style={[styles.heroStat, { backgroundColor: colors.primary + '16' }]}>
            <Icon name="film-outline" size={14} color={colors.primary} />
            <Text style={[styles.heroStatText, { color: colors.primary }]}>
              {channel.videoCount} videos
            </Text>
          </View>
          <View style={[styles.heroStat, { backgroundColor: colors.accent + '16' }]}>
            <Icon name="flash" size={14} color={colors.accent} />
            <Text style={[styles.heroStatText, { color: colors.accent }]}>
              {channel.shortCount} shorts
            </Text>
          </View>
        </View>
        {channel.description ? (
          <Text style={[styles.heroDesc, { color: colors.textMuted }]}>
            {shortDescription(channel.description, 160)}
          </Text>
        ) : null}
      </View>

      <ContentTypeSegment value={filter} onChange={setFilter} />

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      {loadingMedia ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
      ) : items.length === 0 ? (
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
      ) : (
        <FlatList
          key={showGrid ? 'grid' : 'list'}
          data={items}
          numColumns={showGrid ? 2 : 1}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
          columnWrapperStyle={showGrid ? styles.gridRow : undefined}
          renderItem={({ item }) => (
            <DiscoverMediaCard
              item={item}
              variant={showGrid ? 'grid' : 'list'}
              onPress={() => openVideo(item.id)}
              onAdd={() => void handleAdd(item)}
            />
          )}
        />
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroAvatar: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.lg,
  },
  heroStatText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroDesc: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 20,
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
