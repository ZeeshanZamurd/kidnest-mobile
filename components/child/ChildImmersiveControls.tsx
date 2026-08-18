import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { BRAND_CHILD_ACCENT, BRAND_PRIMARY } from '../../constants/branding';

type Props = {
  visible: boolean;
  paused: boolean;
  onBack: () => void;
  onTogglePlay: () => void;
  insetTop: number;
};

/** Giant, kid-friendly fullscreen video chrome — play/pause + big back only. */
export default function ChildImmersiveControls({
  visible,
  paused,
  onBack,
  onTogglePlay,
  insetTop,
}: Props) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={['rgba(123,77,255,0.55)', 'transparent']}
        style={[styles.topFade, { paddingTop: insetTop + 8 }]}
        pointerEvents="box-none"
      >
        <Pressable
          style={styles.backBtn}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" size={34} color="#fff" />
        </Pressable>
      </LinearGradient>

      {paused ? (
        <Pressable style={styles.centerPlay} onPress={onTogglePlay}>
          <View style={styles.playCircle}>
            <Icon name="play" size={56} color="#fff" />
          </View>
        </Pressable>
      ) : (
        <Pressable style={styles.centerTap} onPress={onTogglePlay} />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(123,77,255,0.45)']}
        style={styles.bottomFade}
        pointerEvents="box-none"
      >
        <Pressable style={styles.bottomPlay} onPress={onTogglePlay}>
          <Icon name={paused ? 'play' : 'pause'} size={36} color="#fff" />
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
  },
  backBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTap: {
    ...StyleSheet.absoluteFillObject,
  },
  playCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BRAND_PRIMARY,
    borderWidth: 4,
    borderColor: BRAND_CHILD_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_CHILD_ACCENT,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPlay: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
