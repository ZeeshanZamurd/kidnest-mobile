import React, { memo } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { BRAND_ACCENT } from '../../constants/branding';
import { useTheme } from '../../context/ThemeContext';
import { formatDuration, type BrowseVideo } from '../../api/browse';
import { radius } from '../../theme/colors';
import AssignActionButton, { type AssignButtonState } from './AssignActionButton';
import PremiumContentBadge, { PremiumLockOverlay } from '../ui/PremiumContentBadge';
import CachedImage from '../ui/CachedImage';
import {
  DISCOVER_GRID_GAP,
  DISCOVER_GUTTER,
  DISCOVER_ROW_THUMB_H,
  DISCOVER_ROW_THUMB_W,
} from './discoverLayout';

const { width: SCREEN_W } = Dimensions.get('window');
export const SHORT_COL_W = (SCREEN_W - DISCOVER_GUTTER * 2 - DISCOVER_GRID_GAP) / 2;
const SHORT_THUMB_H = SHORT_COL_W * (16 / 9);

type Layout = 'video' | 'short';

type Props = {
  item: BrowseVideo;
  onPress: () => void;
  onChannelPress?: () => void;
  onAdd?: () => void;
  assignState?: AssignButtonState;
  premiumLocked?: boolean;
  layout?: Layout;
  /** @deprecated use layout */
  variant?: 'grid' | 'list';
};

function DiscoverMediaCard({
  item,
  onPress,
  onChannelPress,
  onAdd,
  assignState = 'idle',
  premiumLocked = false,
  layout = 'video',
  variant,
}: Props) {
  const { colors } = useTheme();
  const isShort = layout === 'short' || variant === 'grid';

  if (isShort) {
    return (
      <View style={styles.gridWrap}>
        <Pressable onPress={onPress} style={styles.gridPress}>
          <View style={[styles.gridThumb, { backgroundColor: colors.border }]}>
            <CachedImage uri={item.thumbnailUrl} style={styles.thumbImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.gridGradient}
            />
            <View style={styles.shortTag}>
              <Icon name="flash" size={9} color="#fff" />
              <Text style={styles.shortTagText}>Short</Text>
            </View>
            {premiumLocked ? (
              <>
                <PremiumContentBadge compact style={styles.premiumBadgeShort} />
                <PremiumLockOverlay compact />
              </>
            ) : null}
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{formatDuration(item.durationSecs)}</Text>
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
            <Text style={[styles.gridChannelText, { color: colors.textMuted }]} numberOfLines={1}>
              {item.channelName}
            </Text>
          </Pressable>
          {onAdd && !premiumLocked ? (
            <AssignActionButton state={assignState} onPress={onAdd} variant="inline" />
          ) : premiumLocked ? (
            <Icon name="lock-closed" size={16} color={colors.textMuted} />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Pressable onPress={onPress} style={styles.rowThumbPress}>
        <View style={[styles.rowThumb, { backgroundColor: colors.border }]}>
          <CachedImage uri={item.thumbnailUrl} style={styles.thumbImage} />
          {premiumLocked ? (
            <>
              <PremiumContentBadge compact style={styles.premiumBadgeRow} />
              <PremiumLockOverlay compact />
            </>
          ) : null}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(item.durationSecs)}</Text>
          </View>
        </View>
      </Pressable>

      <Pressable onPress={onPress} style={styles.rowMeta}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Pressable
          onPress={onChannelPress}
          disabled={!onChannelPress}
          hitSlop={4}
          style={styles.rowChannelHit}
        >
          <Text style={[styles.rowChannel, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.channelName}
          </Text>
        </Pressable>
      </Pressable>

      <View style={styles.rowAction}>
        {onAdd && !premiumLocked ? (
          <AssignActionButton state={assignState} onPress={onAdd} variant="compact" />
        ) : premiumLocked ? (
          <Icon name="lock-closed" size={16} color={colors.textMuted} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridWrap: {
    width: SHORT_COL_W,
    marginBottom: 14,
  },
  gridPress: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  gridThumb: {
    width: SHORT_COL_W,
    height: SHORT_THUMB_H,
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
    height: '48%',
  },
  shortTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: BRAND_ACCENT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shortTagText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  gridTitle: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
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
  premiumBadgeShort: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowThumbPress: {
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  rowThumb: {
    width: DISCOVER_ROW_THUMB_W,
    height: DISCOVER_ROW_THUMB_H,
    borderRadius: radius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  rowMeta: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 4,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  rowChannelHit: {
    alignSelf: 'flex-start',
  },
  rowChannel: {
    fontSize: 12,
    fontWeight: '400',
  },
  rowAction: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadgeRow: {
    position: 'absolute',
    top: 4,
    left: 4,
  },
});

export default memo(DiscoverMediaCard);
