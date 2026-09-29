import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import CachedImage from '../../ui/CachedImage';
import { useTheme } from '../../../context/ThemeContext';
import type { Video } from '../../../types';

type Props = {
  nextVideo: Video | null;
  suggestions: Video[];
  countdownSecs: number | null;
  autoplayEnabled: boolean;
  labels: {
    upNext: string;
    playingIn: string;
    cancel: string;
    suggested: string;
    replay: string;
  };
  onPlayNext: () => void;
  onCancelAutoplay: () => void;
  onSelectVideo: (videoId: string) => void;
  onReplay: () => void;
};

/** YouTube-style end-of-video overlay: up next + suggestions from child library. */
export default function PlayerEndOverlay({
  nextVideo,
  suggestions,
  countdownSecs,
  autoplayEnabled,
  labels,
  onPlayNext,
  onCancelAutoplay,
  onSelectVideo,
  onReplay,
}: Props) {
  const { colors } = useTheme();
  const grid = suggestions.filter((v) => v.id !== nextVideo?.id).slice(0, 8);

  return (
    <View style={styles.root} pointerEvents="box-none">
      <LinearGradient
        colors={['rgba(8,5,22,0.55)', 'rgba(8,5,22,0.92)']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        {nextVideo ? (
          <Pressable
            style={[styles.upNextCard, { borderColor: colors.primary + '66' }]}
            onPress={onPlayNext}
            accessibilityRole="button"
            accessibilityLabel={labels.upNext}
          >
            <CachedImage uri={nextVideo.thumbnail} style={styles.upNextThumb} />
            <View style={styles.upNextMeta}>
              <Text style={[styles.upNextLabel, { color: colors.primary }]}>
                {labels.upNext}
              </Text>
              <Text style={styles.upNextTitle} numberOfLines={2}>
                {nextVideo.title}
              </Text>
              {autoplayEnabled && countdownSecs != null && countdownSecs > 0 ? (
                <Text style={styles.countdown}>
                  {labels.playingIn.replace('{n}', String(countdownSecs))}
                </Text>
              ) : null}
            </View>
            <View style={[styles.playOrb, { backgroundColor: colors.primary }]}>
              <Icon name="play" size={18} color="#fff" style={{ marginLeft: 2 }} />
            </View>
          </Pressable>
        ) : null}

        <View style={styles.actions}>
          {autoplayEnabled && countdownSecs != null && countdownSecs > 0 ? (
            <Pressable
              style={styles.actionBtn}
              onPress={onCancelAutoplay}
              accessibilityRole="button"
              accessibilityLabel={labels.cancel}
            >
              <Text style={styles.actionText}>{labels.cancel}</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.actionBtn}
            onPress={onReplay}
            accessibilityRole="button"
            accessibilityLabel={labels.replay}
          >
            <Icon name="refresh" size={16} color="#fff" />
            <Text style={styles.actionText}>{labels.replay}</Text>
          </Pressable>
        </View>

        {grid.length > 0 ? (
          <View style={styles.suggestedBlock}>
            <Text style={styles.suggestedHeading}>{labels.suggested}</Text>
            <FlatList
              horizontal
              data={grid}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestedList}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.tile}
                  onPress={() => onSelectVideo(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                >
                  <CachedImage uri={item.thumbnail} style={styles.tileThumb} />
                  <Text style={styles.tileTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    justifyContent: 'flex-end',
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  upNextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(20,14,40,0.92)',
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
  },
  upNextThumb: {
    width: 112,
    height: 63,
    borderRadius: 10,
    backgroundColor: '#1a1230',
  },
  upNextMeta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  upNextLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  upNextTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  countdown: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  playOrb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  suggestedBlock: {
    gap: 8,
  },
  suggestedHeading: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '800',
  },
  suggestedList: {
    gap: 10,
  },
  tile: {
    width: 132,
    gap: 4,
  },
  tileThumb: {
    width: 132,
    height: 74,
    borderRadius: 10,
    backgroundColor: '#1a1230',
  },
  tileTitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});
