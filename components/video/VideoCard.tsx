import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';
import type { Video } from '../../types';
import BadgePill from '../ui/BadgePill';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  video: Video;
  onPress: () => void;
  onFavorite?: () => void;
  showStatus?: boolean;
  horizontal?: boolean;
};

export default function VideoCard({
  video,
  onPress,
  onFavorite,
  showStatus = false,
  horizontal = false,
}: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[
        animatedStyle,
        styles.card,
        horizontal && styles.horizontal,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.thumbWrap}>
        <Image source={{ uri: video.thumbnail }} style={styles.thumb} />
        <View style={styles.duration}>
          <Text style={styles.durationText}>{video.duration}</Text>
        </View>
        {video.watchProgress > 0 && video.watchProgress < 1 && (
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${video.watchProgress * 100}%` }]}
            />
          </View>
        )}
        {onFavorite && (
          <Pressable style={styles.heartBtn} onPress={onFavorite}>
            <Icon
              name={video.isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={video.isFavorite ? '#FF6B9D' : '#fff'}
            />
          </Pressable>
        )}
      </View>
      <View style={styles.meta}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={[styles.channel, { color: colors.textMuted }]} numberOfLines={1}>
          {video.channelName} · {video.views} views
        </Text>
        {showStatus && video.status !== 'approved' && (
          <BadgePill label={video.status} status={video.status} />
        )}
      </View>
    </AnimatedPressable>
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
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  duration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  durationText: {
    color: '#fff',
    ...typography.tiny,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B9D',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
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
