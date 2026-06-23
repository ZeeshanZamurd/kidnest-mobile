import React from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { formatDuration, type BrowseVideo } from '../../api/browse';
import { radius, spacing, typography } from '../../theme/colors';
import AssignActionButton, { type AssignButtonState } from './AssignActionButton';

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = spacing.lg;
const GRID_GAP = spacing.sm;
export const SHORT_COL_W = (SCREEN_W - H_PAD * 2 - GRID_GAP) / 2;
const SHORT_THUMB_H = SHORT_COL_W * (16 / 9);

type Layout = 'video' | 'short';

type Props = {
  item: BrowseVideo;
  onPress: () => void;
  onChannelPress?: () => void;
  onAdd?: () => void;
  assignState?: AssignButtonState;
  layout?: Layout;
  /** @deprecated use layout */
  variant?: 'grid' | 'list';
};

export default function DiscoverMediaCard({
  item,
  onPress,
  onChannelPress,
  onAdd,
  assignState = 'idle',
  layout = 'video',
  variant,
}: Props) {
  const { colors } = useTheme();
  const isShort = layout === 'short' || variant === 'grid';

  if (isShort) {
    return (
      <View style={styles.gridWrap}>
        <Pressable onPress={onPress} style={styles.gridPress}>
          <View style={styles.gridThumb}>
            <Image source={{ uri: item.thumbnailUrl ?? '' }} style={styles.thumbImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={styles.gridGradient}
            />
            <View style={styles.shortTag}>
              <Icon name="flash" size={9} color="#fff" />
              <Text style={styles.shortTagText}>Short</Text>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{formatDuration(item.durationSecs)}</Text>
            </View>
            <View style={styles.gridPlay}>
              <Icon name="play" size={22} color="#fff" />
            </View>
            <Text style={styles.gridTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
        </Pressable>
        <View style={styles.gridFooter}>
          <Pressable
            onPress={onChannelPress}
            disabled={!onChannelPress}
            style={styles.gridChannel}
          >
            <Text style={[styles.gridChannelText, { color: colors.primary }]} numberOfLines={1}>
              {item.channelName}
            </Text>
          </Pressable>
          {onAdd ? (
            <AssignActionButton
              state={assignState}
              onPress={onAdd}
              variant="inline"
            />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.videoWrap}>
      <Pressable onPress={onPress} style={styles.videoThumbPress}>
        <View style={styles.videoThumb}>
          <Image source={{ uri: item.thumbnailUrl ?? '' }} style={styles.thumbImage} />
          <View style={styles.videoTag}>
            <Icon name="film-outline" size={10} color="#fff" />
            <Text style={styles.videoTagText}>Video</Text>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(item.durationSecs)}</Text>
          </View>
          <View style={styles.videoPlay}>
            <View style={styles.playCircle}>
              <Icon name="play" size={28} color="#fff" />
            </View>
          </View>
        </View>
      </Pressable>

      <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Pressable
        onPress={onChannelPress}
        disabled={!onChannelPress}
        style={styles.channelRow}
      >
        <Icon name="folder-outline" size={15} color={colors.primary} />
        <Text style={[styles.channelName, { color: colors.primary }]} numberOfLines={1}>
          {item.channelName}
        </Text>
        {onChannelPress ? (
          <Icon name="chevron-forward" size={14} color={colors.textMuted} />
        ) : null}
      </Pressable>
      {onAdd ? (
        <AssignActionButton
          state={assignState}
          onPress={onAdd}
          variant="full"
          style={styles.addBtnSpacing}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gridWrap: {
    width: SHORT_COL_W,
    marginBottom: spacing.md,
  },
  gridPress: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  gridThumb: {
    width: SHORT_COL_W,
    height: SHORT_THUMB_H,
    backgroundColor: '#e2e8f0',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  gridGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  shortTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EC4899',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  shortTagText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  gridPlay: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  gridTitle: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  gridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  gridChannel: { flex: 1 },
  gridChannelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  videoWrap: {
    marginBottom: spacing.lg,
  },
  videoThumbPress: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  videoThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#e2e8f0',
    position: 'relative',
  },
  videoTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  videoTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  durationBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  videoPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  videoTitle: {
    ...typography.bodyBold,
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  channelName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  addBtnSpacing: {
    marginTop: 8,
  },
});
