import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import CachedImage from '../../ui/CachedImage';
import type { Video } from '../../../types';

const INLINE_TILE_W = 160;
const INLINE_THUMB_H = 90;
const OVERLAY_TILE_W = 152;
const OVERLAY_THUMB_H = 86;

type Props = {
  title: string;
  videos: Video[];
  currentVideoId: string;
  onSelectVideo: (videoId: string) => void;
  variant?: 'overlay' | 'inline';
};

export default function PlayerVideoShelf({
  title,
  videos,
  currentVideoId,
  onSelectVideo,
  variant = 'overlay',
}: Props) {
  if (videos.length === 0) return null;

  const isInline = variant === 'inline';
  const tileW = isInline ? INLINE_TILE_W : OVERLAY_TILE_W;
  const thumbH = isInline ? INLINE_THUMB_H : OVERLAY_THUMB_H;

  return (
    <View style={[styles.wrap, isInline && styles.wrapInline]}>
      {!isInline ? (
        <LinearGradient
          colors={['transparent', 'rgba(8,5,22,0.88)', 'rgba(8,5,22,0.96)']}
          style={styles.fade}
          pointerEvents="none"
        />
      ) : null}

      <View style={[styles.panel, isInline ? styles.panelInline : styles.panelOverlay]}>
        {isInline ? (
          <View style={styles.headerRow}>
            <Text style={[styles.heading, styles.headingInline]}>{title}</Text>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{videos.length}</Text>
            </View>
          </View>
        ) : null}

        <FlatList
          horizontal
          data={videos}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const active = item.id === currentVideoId;
            return (
              <Pressable
                style={[styles.tile, { width: tileW }]}
                onPress={() => onSelectVideo(item.id)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                accessibilityState={{ selected: active }}
              >
                <View
                  style={[
                    styles.thumbWrap,
                    { width: tileW, height: thumbH },
                    isInline && styles.thumbWrapInline,
                    active && (isInline ? styles.thumbWrapActiveInline : styles.thumbWrapActive),
                  ]}
                >
                  <CachedImage uri={item.thumbnail} style={styles.thumb} />
                  {active ? (
                    <View style={[styles.playingBadge, isInline && styles.playingBadgeInline]}>
                      <Icon name="volume-high" size={13} color="#fff" />
                    </View>
                  ) : (
                    <View style={[styles.playBadge, isInline && styles.playBadgeInline]}>
                      <Icon name="play" size={14} color="#fff" />
                    </View>
                  )}
                  <View style={styles.durationPill}>
                    <Text style={styles.duration}>{item.duration}</Text>
                  </View>
                </View>
                {isInline ? (
                  <Text style={styles.titleInline} numberOfLines={2}>
                    {item.title}
                  </Text>
                ) : null}
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  wrapInline: {
    marginHorizontal: 12,
    marginBottom: 10,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    height: 28,
  },
  panel: {
    backgroundColor: 'rgba(8,5,22,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 10,
    paddingBottom: 8,
  },
  panelOverlay: {
    paddingTop: 10,
    paddingBottom: 12,
  },
  panelInline: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopWidth: 0,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#7B4DFF',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(123,77,255,0.12)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  heading: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
    flex: 1,
  },
  headingInline: {
    color: '#3D2A7A',
    fontSize: 15,
  },
  countPill: {
    backgroundColor: 'rgba(123,77,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  countText: {
    color: '#7B4DFF',
    fontSize: 11,
    fontWeight: '800',
  },
  list: {
    paddingHorizontal: 14,
    gap: 12,
  },
  tile: {
    gap: 6,
  },
  thumbWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1a1230',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrapInline: {
    backgroundColor: '#EDE8FF',
    borderRadius: 12,
  },
  thumbWrapActive: {
    borderColor: '#A78BFA',
  },
  thumbWrapActiveInline: {
    borderColor: '#7B4DFF',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  playBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(123,77,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadgeInline: {
    backgroundColor: '#7B4DFF',
  },
  playingBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(76, 175, 80, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingBadgeInline: {
    backgroundColor: '#22C55E',
  },
  durationPill: {
    position: 'absolute',
    right: 8,
    top: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  duration: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  titleInline: {
    color: '#4A3278',
    fontSize: 11,
    fontWeight: '700',
  },
});
