import React, { memo, useCallback } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import type { BrowseChannel, BrowseVideo } from '../../api/browse';
import DiscoverShelfCard from './DiscoverShelfCard';
import type { AssignButtonState } from './AssignActionButton';
import { DISCOVER_GUTTER } from './discoverLayout';

type BaseProps = {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
};

type VideoShelfProps = BaseProps & {
  kind: 'videos' | 'shorts';
  items: BrowseVideo[];
  onPressItem: (item: BrowseVideo) => void;
  onAddItem?: (item: BrowseVideo) => void;
  getAssignState?: (item: BrowseVideo) => AssignButtonState;
  isPremiumLocked?: (item: BrowseVideo) => boolean;
};

type ChannelShelfProps = BaseProps & {
  kind: 'channels';
  items: BrowseChannel[];
  onPressItem: (item: BrowseChannel) => void;
  onAddItem?: (item: BrowseChannel) => void;
  getAssignState?: (item: BrowseChannel) => AssignButtonState;
  isPremiumLocked?: (item: BrowseChannel) => boolean;
};

type Props = VideoShelfProps | ChannelShelfProps;

function DiscoverShelf(props: Props) {
  const { colors } = useTheme();
  const { title, subtitle, onSeeAll, kind, items } = props;

  const renderVideo = useCallback(
    ({ item }: { item: BrowseVideo }) => {
      if (kind === 'channels') return null;
      const videoProps = props as VideoShelfProps;
      return (
        <DiscoverShelfCard
          kind={kind === 'shorts' ? 'short' : 'video'}
          item={item}
          onPress={() => videoProps.onPressItem(item)}
          onAdd={videoProps.onAddItem ? () => videoProps.onAddItem?.(item) : undefined}
          assignState={videoProps.getAssignState?.(item)}
          premiumLocked={videoProps.isPremiumLocked?.(item)}
        />
      );
    },
    [kind, props],
  );

  const renderChannel = useCallback(
    ({ item }: { item: BrowseChannel }) => {
      if (kind !== 'channels') return null;
      const channelProps = props as ChannelShelfProps;
      return (
        <DiscoverShelfCard
          kind="channel"
          item={item}
          onPress={() => channelProps.onPressItem(item)}
          onAdd={channelProps.onAddItem ? () => channelProps.onAddItem?.(item) : undefined}
          assignState={channelProps.getAssignState?.(item)}
          premiumLocked={channelProps.isPremiumLocked?.(item)}
        />
      );
    },
    [kind, props],
  );

  if (!items.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAll}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
            <Icon name="chevron-forward" size={14} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>

      {kind === 'channels' ? (
        <FlatList
          horizontal
          nestedScrollEnabled
          data={items}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          initialNumToRender={6}
          windowSize={5}
          renderItem={renderChannel}
        />
      ) : (
        <FlatList
          horizontal
          nestedScrollEnabled
          data={items as BrowseVideo[]}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          initialNumToRender={6}
          windowSize={5}
          renderItem={renderVideo}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 22,
  },
  header: {
    paddingHorizontal: DISCOVER_GUTTER,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    paddingHorizontal: DISCOVER_GUTTER,
  },
});

export default memo(DiscoverShelf);
