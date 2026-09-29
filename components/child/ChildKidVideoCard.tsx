import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import type { Video } from '../../types';
import type { ChildSectionTheme } from './categoryThemes';
import CachedImage from '../ui/CachedImage';
import { childTapHaptic } from '../../utils/childHaptics';
import { useTheme } from '../../context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  video: Video;
  theme: ChildSectionTheme;
  onPress: () => void;
  onFavorite?: () => void;
  large?: boolean;
  carousel?: boolean;
};

/** Clean kid video tile — soft radius, theme-aware text. */
function ChildKidVideoCard({
  video,
  theme,
  onPress,
  onFavorite,
  large = false,
  carousel = false,
}: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        childTapHaptic('tap');
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 16, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
      }}
      style={[styles.wrap, large && styles.wrapLarge, carousel && styles.wrapCarousel, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={`Play ${video.title}`}
    >
      <View style={[styles.thumbWrap, { backgroundColor: colors.border }]}>
        <CachedImage uri={video.thumbnail} style={styles.thumb} />
        <LinearGradient
          colors={['transparent', 'rgba(15,23,42,0.45)']}
          style={styles.thumbShade}
        />
        <View style={[styles.playBubble, { backgroundColor: theme.color }]}>
          <Icon name="play" size={large ? 20 : 16} color="#fff" style={styles.playIcon} />
        </View>
        {onFavorite ? (
          <Pressable
            style={styles.heart}
            onPress={() => {
              childTapHaptic('select');
              onFavorite();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              video.isFavorite ? `Unfavorite ${video.title}` : `Favorite ${video.title}`
            }
          >
            <Icon
              name={video.isFavorite ? 'heart' : 'heart-outline'}
              size={16}
              color={video.isFavorite ? '#FF4DB8' : '#fff'}
            />
          </Pressable>
        ) : null}
        <View style={styles.durationPill}>
          <Text style={styles.duration}>{video.duration}</Text>
        </View>
        {video.watchProgress > 0 && video.watchProgress < 1 ? (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${video.watchProgress * 100}%`, backgroundColor: theme.color },
              ]}
            />
          </View>
        ) : null}
      </View>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {video.title}
      </Text>
      {video.channelName ? (
        <Text style={[styles.channel, { color: colors.textMuted }]} numberOfLines={1}>
          {video.channelName}
        </Text>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '48%',
    marginBottom: 14,
  },
  wrapLarge: {
    width: '100%',
  },
  wrapCarousel: {
    width: 152,
  },
  thumbWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbShade: {
    ...StyleSheet.absoluteFillObject,
  },
  playBubble: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -18,
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 2,
  },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  duration: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  progressFill: {
    height: '100%',
  },
  title: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  channel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
  },
});

export default memo(ChildKidVideoCard);
