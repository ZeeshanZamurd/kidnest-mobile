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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  video: Video;
  theme: ChildSectionTheme;
  onPress: () => void;
  onFavorite?: () => void;
  large?: boolean;
  /** Fixed width for horizontal carousels */
  carousel?: boolean;
};

/** Oversized kid-friendly video tile with glossy color block styling. */
function ChildKidVideoCard({
  video,
  theme,
  onPress,
  onFavorite,
  large = false,
  carousel = false,
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 14, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 220 });
      }}
      style={[styles.wrap, large && styles.wrapLarge, carousel && styles.wrapCarousel, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={video.title}
    >
      <LinearGradient colors={theme.gradient} style={styles.frame}>
        <View style={[styles.inner, { borderColor: theme.borderColor }]}>
          <CachedImage uri={video.thumbnail} style={styles.thumb} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.thumbShade}
          />
          <View style={[styles.playBubble, { backgroundColor: theme.color }]}>
            <Icon name="play" size={large ? 28 : 22} color="#fff" />
          </View>
          {onFavorite ? (
            <Pressable style={styles.heart} onPress={onFavorite} hitSlop={10}>
              <Icon
                name={video.isFavorite ? 'heart' : 'heart-outline'}
                size={22}
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
      </LinearGradient>
      <Text style={styles.emoji}>{theme.emoji}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '47%',
    marginBottom: 16,
  },
  wrapLarge: {
    width: '100%',
  },
  wrapCarousel: {
    width: 168,
  },
  frame: {
    borderRadius: 28,
    padding: 4,
    shadowColor: '#7B4DFF',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  inner: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 4,
    backgroundColor: '#fff',
    aspectRatio: 16 / 11,
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
    marginLeft: -26,
    marginTop: -26,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationPill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  duration: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  progressFill: {
    height: '100%',
  },
  emoji: {
    position: 'absolute',
    top: -6,
    left: 10,
    fontSize: 24,
  },
});

export default memo(ChildKidVideoCard);
