import React, { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Video from 'react-native-video';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';
import type { Video as VideoType } from '../../types';
import BadgePill from '../ui/BadgePill';
import CachedImage from '../ui/CachedImage';
import { buildCachedVideoSource } from '../../services/cache/videoCache';

const PROGRESS_TRACK_H = 4;
const PROGRESS_RED = '#ff0000';

type Props = {
  video: VideoType;
  onPress: () => void;
  onFavorite?: () => void;
  showStatus?: boolean;
  horizontal?: boolean;
  /** Tap play on thumbnail to preview inline (no full-screen player). */
  inlinePlay?: boolean;
  isPlayingInline?: boolean;
  onStartInline?: () => void;
  onStopInline?: () => void;
};

function VideoCard({
  video,
  onPress,
  onFavorite,
  showStatus = false,
  horizontal = false,
  inlinePlay = false,
  isPlayingInline = false,
  onStartInline,
  onStopInline,
}: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const [inlinePaused, setInlinePaused] = useState(false);
  const [inlineProgress, setInlineProgress] = useState(0);
  const streamUri =
    typeof video.streamUrl === 'string' && video.streamUrl.trim().length > 0
      ? video.streamUrl.trim()
      : null;
  const canInlinePlay = inlinePlay && Boolean(streamUri);

  useEffect(() => {
    if (!isPlayingInline) {
      setInlinePaused(false);
      setInlineProgress(0);
    }
  }, [isPlayingInline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const progress =
    isPlayingInline && inlineProgress > 0
      ? inlineProgress
      : video.watchProgress > 0 && video.watchProgress < 1
        ? video.watchProgress
        : 0;

  const handleThumbPress = () => {
    if (canInlinePlay && !isPlayingInline) {
      onStartInline?.();
      return;
    }
    if (isPlayingInline) {
      setInlinePaused((p) => !p);
      return;
    }
    onPress();
  };

  const handleMetaPress = () => {
    if (isPlayingInline) {
      onStopInline?.();
    }
    onPress();
  };

  const showProgress = isPlayingInline ? inlineProgress >= 0 : progress > 0;
  const progressWidth = isPlayingInline ? Math.max(inlineProgress, 0) : progress;

  return (
    <Animated.View
      style={[
        animatedStyle,
        styles.card,
        horizontal && styles.horizontal,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Pressable
        style={styles.thumbWrap}
        onPress={handleThumbPress}
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
      >
        {isPlayingInline && streamUri ? (
          <Video
            source={buildCachedVideoSource(streamUri)!}
            style={styles.thumb}
            resizeMode="cover"
            paused={inlinePaused}
            repeat={false}
            playInBackground={false}
            playWhenInactive={false}
            onProgress={(e) => {
              if (video.durationSeconds > 0) {
                setInlineProgress(Math.min(1, e.currentTime / video.durationSeconds));
              }
            }}
            onEnd={() => {
              setInlinePaused(true);
              onStopInline?.();
            }}
          />
        ) : (
          <CachedImage uri={video.thumbnail} style={styles.thumb} />
        )}

        {canInlinePlay && !isPlayingInline ? (
          <View style={styles.playOverlay} pointerEvents="none">
            <View style={styles.playCircle}>
              <Icon name="play" size={28} color="#fff" />
            </View>
          </View>
        ) : null}

        {isPlayingInline && inlinePaused ? (
          <View style={styles.playOverlay} pointerEvents="none">
            <View style={styles.playCircle}>
              <Icon name="play" size={28} color="#fff" />
            </View>
          </View>
        ) : null}

        {!isPlayingInline ? (
          <View style={styles.duration}>
            <Text style={styles.durationText}>{video.duration}</Text>
          </View>
        ) : null}

        {showProgress ? (
          <View style={styles.progressTrack} pointerEvents="none">
            <View style={[styles.progressFill, { width: `${progressWidth * 100}%` }]} />
          </View>
        ) : null}

        {onFavorite ? (
          <Pressable style={styles.heartBtn} onPress={onFavorite}>
            <Icon
              name={video.isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={video.isFavorite ? '#FF6B9D' : '#fff'}
            />
          </Pressable>
        ) : null}

        {isPlayingInline ? (
          <Pressable style={styles.expandBtn} onPress={handleMetaPress}>
            <Icon name="expand" size={18} color="#fff" />
          </Pressable>
        ) : null}
      </Pressable>

      <Pressable style={styles.meta} onPress={handleMetaPress}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={[styles.channel, { color: colors.textMuted }]} numberOfLines={1}>
          {video.channelName} · {video.views} views
        </Text>
        {showStatus && video.status !== 'approved' ? (
          <BadgePill label={video.status} status={video.status} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  horizontal: {
    width: 260,
    marginRight: spacing.md,
    marginBottom: 0,
  },
  thumbWrap: {
    position: 'relative',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  duration: {
    position: 'absolute',
    bottom: 10,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.82)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  durationText: {
    color: '#fff',
    ...typography.tiny,
    fontWeight: '700',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PROGRESS_TRACK_H,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PROGRESS_RED,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    padding: spacing.md,
    gap: 4,
  },
  title: {
    ...typography.bodyBold,
  },
  channel: {
    ...typography.caption,
  },
});

export default memo(VideoCard);
