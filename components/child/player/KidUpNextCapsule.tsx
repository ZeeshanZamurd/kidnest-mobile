import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  BRAND_ACCENT,
  BRAND_CHILD_ACCENT,
  BRAND_PRIMARY,
} from '../../../constants/branding';
import { spacing, typography } from '../../../theme/colors';
import type { Video } from '../../../types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  video: Video;
  label: string;
  onPress: () => void;
};

export default function KidUpNextCapsule({ video, label, onPress }: Props) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 14, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1.03, { damping: 10, stiffness: 200 }, () => {
          scale.value = withSpring(1);
        });
      }}
      style={[styles.wrap, anim]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <LinearGradient
        colors={['#F3EEFF', '#E8DEFF', '#FFD6F0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glowRing}
      >
        <View style={styles.inner}>
          <View style={styles.thumbFrame}>
            <Image source={{ uri: video.thumbnail }} style={styles.thumb} />
            <LinearGradient
              colors={['transparent', 'rgba(123,77,255,0.35)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.playOrb}>
              <Icon name="play" size={18} color="#fff" />
            </View>
          </View>
          <View style={styles.meta}>
            <View style={styles.labelRow}>
              <Text style={styles.sparkle}>✨</Text>
              <Text style={styles.label}>{label}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {video.title}
            </Text>
          </View>
          <LinearGradient
            colors={[BRAND_PRIMARY, BRAND_ACCENT]}
            style={styles.arrowOrb}
          >
            <Icon name="arrow-forward" size={22} color="#fff" />
          </LinearGradient>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  glowRing: {
    borderRadius: 999,
    padding: 4,
    shadowColor: BRAND_CHILD_ACCENT,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: 'rgba(123, 77, 255, 0.25)',
  },
  thumbFrame: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: BRAND_PRIMARY,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  playOrb: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sparkle: { fontSize: 14 },
  label: {
    ...typography.tiny,
    fontWeight: '800',
    color: BRAND_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    ...typography.bodyBold,
    color: '#3D2A7A',
    lineHeight: 20,
  },
  arrowOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
});
