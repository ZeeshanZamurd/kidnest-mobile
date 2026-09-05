import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { formatDuration, type BrowseChannel, type BrowseVideo } from '../../api/browse';
import { radius } from '../../theme/colors';
import CachedImage from '../ui/CachedImage';
import PremiumContentBadge, { PremiumLockOverlay } from '../ui/PremiumContentBadge';
import AssignActionButton, { type AssignButtonState } from './AssignActionButton';

export const SHELF_VIDEO_W = 168;
export const SHELF_VIDEO_H = 94; // 16:9
export const SHELF_SHORT_W = 118;
export const SHELF_SHORT_H = 210;
export const SHELF_CHANNEL_W = 112;

type VideoProps = {
  kind: 'video' | 'short';
  item: BrowseVideo;
  onPress: () => void;
  onAdd?: () => void;
  assignState?: AssignButtonState;
  premiumLocked?: boolean;
};

type ChannelProps = {
  kind: 'channel';
  item: BrowseChannel;
  onPress: () => void;
  onAdd?: () => void;
  assignState?: AssignButtonState;
  premiumLocked?: boolean;
};

type Props = VideoProps | ChannelProps;

function DiscoverShelfCard(props: Props) {
  const { colors } = useTheme();

  if (props.kind === 'channel') {
    const { item, onPress, onAdd, assignState = 'idle', premiumLocked } = props;
    return (
      <View style={styles.channelWrap}>
        <Pressable onPress={onPress} style={styles.channelPress}>
          <View style={[styles.channelAvatar, { backgroundColor: colors.border }]}>
            <CachedImage uri={item.thumbnailUrl} style={styles.fill} />
            {premiumLocked ? (
              <View style={styles.channelLock}>
                <Icon name="lock-closed" size={14} color="#fff" />
              </View>
            ) : null}
          </View>
          <Text style={[styles.channelTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          {premiumLocked ? (
            <View style={styles.channelPremiumBadge}>
              <PremiumContentBadge compact />
            </View>
          ) : (
            <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
              {item.videoCount} videos
            </Text>
          )}
        </Pressable>
        {onAdd && !premiumLocked ? (
          <View style={styles.channelAdd}>
            <AssignActionButton
              state={assignState}
              onPress={onAdd}
              variant="shelf"
            />
          </View>
        ) : premiumLocked && onAdd ? (
          <Pressable onPress={onAdd} style={styles.channelAdd} hitSlop={8}>
            <Icon name="diamond" size={16} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    );
  }

  const {
    item,
    onPress,
    onAdd,
    assignState = 'idle',
    premiumLocked,
    kind,
  } = props;
  const isShort = kind === 'short';
  const width = isShort ? SHELF_SHORT_W : SHELF_VIDEO_W;
  const height = isShort ? SHELF_SHORT_H : SHELF_VIDEO_H;

  return (
    <View style={[styles.videoWrap, { width }]}>
      <View style={[styles.thumb, { width, height, backgroundColor: colors.border }]}>
        <Pressable onPress={onPress} style={[styles.thumbMedia, { width, height }]}>
          <CachedImage uri={item.thumbnailUrl} style={styles.fill} />
          {premiumLocked ? (
            <>
              <PremiumContentBadge compact style={styles.premiumBadge} />
              <PremiumLockOverlay compact />
            </>
          ) : null}
          {isShort ? (
            <View style={styles.shortTag}>
              <Icon name="flash" size={9} color="#fff" />
              <Text style={styles.shortTagText}>Short</Text>
            </View>
          ) : null}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(item.durationSecs)}</Text>
          </View>
        </Pressable>
        {onAdd && !premiumLocked ? (
          <View style={styles.addOverlay}>
            <AssignActionButton
              state={assignState}
              onPress={onAdd}
              variant="shelf"
            />
          </View>
        ) : null}
      </View>
      <Pressable onPress={onPress}>
        <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        {!isShort ? (
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
            {item.channelName}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  videoWrap: {
    marginRight: 12,
  },
  thumb: {
    position: 'relative',
  },
  thumbMedia: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  videoTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  meta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
  },
  durationBadge: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    backgroundColor: 'rgba(0,0,0,0.78)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  shortTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FF4DB8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shortTagText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  premiumBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  addOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
  },
  channelWrap: {
    width: SHELF_CHANNEL_W,
    marginRight: 14,
    alignItems: 'center',
  },
  channelPress: {
    alignItems: 'center',
    width: '100%',
  },
  channelAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  channelLock: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  channelTitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  channelAdd: {
    marginTop: 8,
  },
  channelPremiumBadge: {
    marginTop: 6,
    alignItems: 'center',
  },
});

export default memo(DiscoverShelfCard);
