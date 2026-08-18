import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated from 'react-native-reanimated';
import type { AnimatedStyle } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {
  BRAND_ACCENT,
  BRAND_CHILD_ACCENT,
  BRAND_CYAN,
  BRAND_PRIMARY,
} from '../../../constants/branding';
import KidPlayerPillButton from './KidPlayerPillButton';
import KidStarSeekBar from './KidStarSeekBar';

export const KID_CONTROLS_HEIGHT = 108;
export const KID_MINI_PROGRESS = 6;

type Props = {
  overlayStyle: AnimatedStyle<object>;
  controlsVisible: boolean;
  paused: boolean;
  progress: number;
  buffered: number;
  duration: number;
  fullscreen: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  onBack: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFullscreen: () => void;
  onSeek: (time: number) => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
  onControlInteraction: () => void;
};

export default function KidPlayerControlsOverlay({
  overlayStyle,
  controlsVisible,
  paused,
  progress,
  buffered,
  duration,
  fullscreen,
  hasPrev,
  hasNext,
  onBack,
  onTogglePlay,
  onPrev,
  onNext,
  onFullscreen,
  onSeek,
  onSeekStart,
  onSeekEnd,
  onControlInteraction,
}: Props) {
  return (
    <Animated.View
      style={[styles.chrome, overlayStyle]}
      pointerEvents={controlsVisible ? 'box-none' : 'none'}
    >
      <LinearGradient
        colors={['rgba(123,77,255,0.5)', 'transparent']}
        style={styles.topFade}
        pointerEvents="box-none"
      >
        <KidPlayerPillButton
          icon="chevron-back"
          onPress={() => {
            onControlInteraction();
            onBack();
          }}
          colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.18)']}
          glowColor={BRAND_PRIMARY}
          size={48}
          accessibilityLabel="Go back"
        />
      </LinearGradient>

      <LinearGradient
        colors={['transparent', 'rgba(243,238,255,0.92)']}
        style={styles.bottomFade}
        pointerEvents="box-none"
      >
        <View style={styles.controlsBar} pointerEvents="box-none">
          <View style={styles.pillRow}>
            <KidPlayerPillButton
              icon="play-skip-back"
              onPress={() => {
                onControlInteraction();
                onPrev();
              }}
              colors={[BRAND_PRIMARY, '#9B6BFF']}
              glowColor={BRAND_PRIMARY}
              size={46}
              disabled={!hasPrev}
              accessibilityLabel="Previous"
            />
            <KidPlayerPillButton
              icon={paused ? 'play' : 'pause'}
              onPress={() => {
                onControlInteraction();
                onTogglePlay();
              }}
              colors={[BRAND_PRIMARY, BRAND_ACCENT]}
              glowColor={BRAND_CHILD_ACCENT}
              size={58}
              accessibilityLabel={paused ? 'Play' : 'Pause'}
            />
            <KidPlayerPillButton
              icon="play-skip-forward"
              onPress={() => {
                onControlInteraction();
                onNext();
              }}
              colors={[BRAND_CYAN, '#3DD4EE']}
              glowColor={BRAND_CYAN}
              size={46}
              disabled={!hasNext}
              accessibilityLabel="Next"
            />
            <View style={styles.spacer} />
            <KidPlayerPillButton
              icon={fullscreen ? 'contract' : 'expand'}
              onPress={() => {
                onControlInteraction();
                onFullscreen();
              }}
              colors={['#FF7DC8', BRAND_ACCENT]}
              glowColor={BRAND_ACCENT}
              size={46}
              accessibilityLabel={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            />
          </View>
          <KidStarSeekBar
            progress={progress}
            buffered={buffered}
            duration={duration}
            onSeek={onSeek}
            onSeekStart={onSeekStart}
            onSeekEnd={onSeekEnd}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

/** Giant center play when paused — kid tap target. */
export function KidCenterPlayButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.centerPlay} onPress={onPress} accessibilityRole="button">
      <LinearGradient
        colors={[BRAND_PRIMARY, '#9B6BFF']}
        style={styles.centerPlayCircle}
      >
        <Icon name="play" size={48} color="#fff" />
      </LinearGradient>
    </Pressable>
  );
}

/** Thin gradient tick when chrome is hidden. */
export function KidMiniProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.miniTrack} pointerEvents="none">
      <LinearGradient
        colors={[BRAND_PRIMARY, BRAND_CYAN]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.miniFill, { width: `${Math.min(100, progress * 100)}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chrome: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 88,
    paddingTop: 8,
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 32,
  },
  controlsBar: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 4,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  spacer: { flex: 1 },
  centerPlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: BRAND_CHILD_ACCENT,
    shadowColor: BRAND_CHILD_ACCENT,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  miniTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: KID_MINI_PROGRESS,
    backgroundColor: 'rgba(232, 222, 255, 0.45)',
    zIndex: 4,
  },
  miniFill: {
    height: '100%',
  },
});
