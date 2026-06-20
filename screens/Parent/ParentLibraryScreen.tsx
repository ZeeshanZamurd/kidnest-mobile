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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import EmptyState from '../../components/ui/EmptyState';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { spacing, typography, radius } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import {
  fetchChildLibrary,
  removeChannel,
  removeVideo,
  type AssignedChannel,
  type AssignedVideo,
} from '../../api/assignments';
import { fetchParentChildren, type ParentChild } from '../../api/parent';
import { formatDuration } from '../../api/browse';
import { useAppStore } from '../../store/useAppStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ParentLibraryScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const activeChildId = useAppStore((s) => s.activeChildId);
  const setActiveChild = useAppStore((s) => s.setActiveChild);
  const setApiChildren = useAppStore((s) => s.setApiChildren);

  const [children, setChildren] = useState<ParentChild[]>([]);
  const [videos, setVideos] = useState<AssignedVideo[]>([]);
  const [channels, setChannels] = useState<AssignedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'videos' | 'channels'>('videos');

  const childId = activeChildId ?? children[0]?.id ?? null;
  const { headerTop } = useAppInsets();
  const listBottomPad = useStackScreenPadding();

  const loadChildren = useCallback(async () => {
    try {
      const list = await fetchParentChildren();
      setChildren(list);
      setApiChildren(list);
      if (!activeChildId && list[0]) setActiveChild(list[0].id);
    } catch {
      /* keep mock children */
    }
  }, [activeChildId, setActiveChild, setApiChildren]);

  const loadLibrary = useCallback(async () => {
    if (!childId) return;
    setLoading(true);
    try {
      const lib = await fetchChildLibrary(childId);
      setVideos(lib.videos);
      setChannels(lib.channels);
    } catch {
      setVideos([]);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    void loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  const confirmRemoveVideo = (video: AssignedVideo) => {
    if (!childId) return;
    Alert.alert('Remove video?', video.video.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => void removeVideo(childId, video.videoId).then(() => loadLibrary()),
      },
    ]);
  };

  const confirmRemoveChannel = (channel: AssignedChannel) => {
    if (!childId) return;
    Alert.alert('Remove channel?', channel.channel.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => void removeChannel(childId, channel.channelId).then(() => loadLibrary()),
      },
    ]);
  };

  return (
    <GradientBackground variant="subtle">
      <View style={[styles.header, { paddingTop: headerTop }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>My library</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Back</Text>
        </Pressable>
      </View>

      <ScrollChildPicker
        children={children}
        activeId={childId}
        onSelect={setActiveChild}
        colors={colors}
      />

      <View style={styles.tabs}>
        {(['videos', 'channels'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabBtn, tab === t && { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: tab === t ? '#fff' : colors.text, fontWeight: '600' }}>
              {t === 'videos' ? `Videos (${videos.length})` : `Channels (${channels.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : tab === 'videos' ? (
        videos.length === 0 ? (
          <EmptyState icon="film" title="No videos yet" description="Browse and add videos for this child." />
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
            renderItem={({ item }) => (
              <View style={[styles.row, { borderColor: colors.border }]}>
                <Image source={{ uri: item.video.thumbnailUrl ?? '' }} style={styles.thumb} />
                <View style={styles.rowBody}>
                  <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.video.title}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textMuted }]}>
                    {item.video.channel.title} · {formatDuration(item.video.durationSecs)}
                  </Text>
                </View>
                <Pressable onPress={() => confirmRemoveVideo(item)}>
                  <Icon name="trash-outline" size={22} color={colors.danger} />
                </Pressable>
              </View>
            )}
          />
        )
      ) : channels.length === 0 ? (
        <EmptyState icon="tv" title="No channels yet" description="Browse and add full channels for this child." />
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
          renderItem={({ item }) => (
            <View style={[styles.row, { borderColor: colors.border }]}>
              <Image source={{ uri: item.channel.thumbnailUrl ?? '' }} style={styles.thumb} />
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.channel.title}
                </Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {item.channel.primaryCategory?.name ?? 'Channel'}
                  {item.channel.primaryLanguage ? ` · ${item.channel.primaryLanguage.name}` : ''}
                </Text>
              </View>
              <Pressable onPress={() => confirmRemoveChannel(item)}>
                <Icon name="trash-outline" size={22} color={colors.danger} />
              </Pressable>
            </View>
          )}
        />
      )}
    </GradientBackground>
  );
}

function ScrollChildPicker({
  children,
  activeId,
  onSelect,
  colors,
}: {
  children: ParentChild[];
  activeId: string | null;
  onSelect: (id: string) => void;
  colors: { primary: string; text: string; border: string; card: string };
}) {
  if (!children.length) return null;
  return (
    <FlatList
      horizontal
      data={children}
      keyExtractor={(c) => c.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.childPicker}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onSelect(item.id)}
          style={[
            styles.childChip,
            {
              backgroundColor: activeId === item.id ? colors.primary : colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={{ color: activeId === item.id ? '#fff' : colors.text, fontWeight: '600' }}>
            {item.user.displayName}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  back: { padding: 4 },
  title: { ...typography.h2 },
  childPicker: { paddingHorizontal: spacing.lg, gap: 8, marginBottom: spacing.md },
  childChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginRight: 8,
  },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  list: { paddingHorizontal: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  thumb: { width: 64, height: 48, borderRadius: radius.sm },
  rowBody: { flex: 1 },
  rowTitle: { ...typography.bodyBold },
  meta: { ...typography.caption, marginTop: 2 },
});
