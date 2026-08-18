import React from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { BRAND_ACCENT, BRAND_PRIMARY } from '../../constants/branding';
import { spacing, typography } from '../../theme/colors';
import CachedImage from '../ui/CachedImage';
import AnimatedPressable from './player/AnimatedPressable';
import VideoCard from './VideoCard';
import type { Video } from '../../types';

const COMPACT = {
  hPad: 14,
  gap: 10,
  gapSm: 6,
  cardPad: 11,
  upNextH: 56,
  decorSize: 22,
} as const;

type Props = {
  title: string;
  channelName: string;
  channelThumbnailUrl?: string | null;
  channelNavigable: boolean;
  showActions: boolean;
  isFavorite: boolean;
  isChannelFavorite: boolean;
  hasChannel: boolean;
  nextVideo: Video | null;
  showUpNext: boolean;
  suggestedVideos: Video[];
  labels: {
    favorites: string;
    channels: string;
    visitChannel: string;
    upNext: string;
    suggested: string;
  };
  onOpenChannel: () => void;
  onToggleFavorite: () => void;
  onToggleChannel: () => void;
  onUpNext: () => void;
  onVideo: (id: string) => void;
  onFavoriteVideo: (id: string) => void;
};

function GlassTitleCard({ title, channelName }: { title: string; channelName: string }) {
  const inner = (
    <View style={styles.glassInner}>
      <Text style={styles.glassTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.glassChannel} numberOfLines={1}>
        {channelName}
      </Text>
      <Text style={styles.decorStar} accessibilityElementsHidden>
        ⭐
      </Text>
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.glassWrap}>
        <BlurView blurType="light" blurAmount={18} style={StyleSheet.absoluteFill} />
        <View style={styles.glassFallback}>{inner}</View>
      </View>
    );
  }

  return <View style={[styles.glassWrap, styles.glassAndroid]}>{inner}</View>;
}

function ChannelAvatar({
  name,
  thumbnailUrl,
  size = 48,
}: {
  name: string;
  thumbnailUrl?: string | null;
  size?: number;
}) {
  const initial = (name.trim().charAt(0) || '?').toUpperCase();

  if (thumbnailUrl) {
    return (
      <CachedImage
        uri={thumbnailUrl}
        style={[
          styles.channelAvatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    );
  }

  return (
    <LinearGradient
      colors={['#9B6BFF', '#7B4DFF']}
      style={[styles.channelAvatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.channelInitial, { fontSize: size * 0.38 }]}>{initial}</Text>
    </LinearGradient>
  );
}

function ActionChip({
  icon,
  label,
  active,
  accent,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      style={[
        styles.actionChip,
        active && { backgroundColor: `${accent}18`, borderColor: `${accent}55` },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Icon name={icon} size={15} color={active ? accent : '#8B7AA8'} />
      <Text style={[styles.actionChipLabel, active && { color: accent }]} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

function VisitChannelCard({
  channelName,
  channelThumbnailUrl,
  visitLabel,
  onPress,
}: {
  channelName: string;
  channelThumbnailUrl?: string | null;
  visitLabel: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      style={styles.visitRow}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${visitLabel}: ${channelName}`}
    >
      <ChannelAvatar name={channelName} thumbnailUrl={channelThumbnailUrl} size={34} />
      <View style={styles.visitCopy}>
        <Text style={styles.visitChannelName} numberOfLines={1}>
          {channelName}
        </Text>
        <Text style={styles.visitHint} numberOfLines={1}>
          {visitLabel}
        </Text>
      </View>
      <Icon name="chevron-forward" size={16} color={BRAND_PRIMARY} />
    </AnimatedPressable>
  );
}

export default function VideoDetailPanel({
  title,
  channelName,
  channelThumbnailUrl,
  channelNavigable,
  showActions,
  isFavorite,
  isChannelFavorite,
  hasChannel,
  nextVideo,
  showUpNext,
  suggestedVideos,
  labels,
  onOpenChannel,
  onToggleFavorite,
  onToggleChannel,
  onUpNext,
  onVideo,
  onFavoriteVideo,
}: Props) {
  return (
    <View style={styles.panel}>
      <GlassTitleCard title={title} channelName={channelName} />

      {showActions || channelNavigable ? (
        <View style={styles.actionsCard}>
          {showActions ? (
            <View style={styles.chipRow}>
              <ActionChip
                icon={isFavorite ? 'heart' : 'heart-outline'}
                label={labels.favorites}
                active={isFavorite}
                accent={BRAND_ACCENT}
                onPress={onToggleFavorite}
              />
              {hasChannel ? (
                <ActionChip
                  icon={isChannelFavorite ? 'star' : 'star-outline'}
                  label={labels.channels}
                  active={isChannelFavorite}
                  accent="#D4920A"
                  onPress={onToggleChannel}
                />
              ) : null}
            </View>
          ) : null}

          {channelNavigable ? (
            <>
              {showActions ? <View style={styles.actionsDivider} /> : null}
              <VisitChannelCard
                channelName={channelName}
                channelThumbnailUrl={channelThumbnailUrl}
                visitLabel={labels.visitChannel}
                onPress={onOpenChannel}
              />
            </>
          ) : null}
        </View>
      ) : null}

      {showUpNext && nextVideo ? (
        <Pressable onPress={onUpNext} accessibilityRole="button">
          <LinearGradient
            colors={[BRAND_PRIMARY, '#9B6BFF', BRAND_PRIMARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upNextBorder}
          >
            <View style={styles.upNextInner}>
              <Image source={{ uri: nextVideo.thumbnail }} style={styles.upNextThumb} />
              <View style={styles.upNextText}>
                <Text style={styles.upNextLabel}>{labels.upNext}</Text>
                <Text style={styles.upNextTitle} numberOfLines={1}>
                  {nextVideo.title}
                </Text>
              </View>
              <View style={styles.upNextPlay}>
                <Icon name="play" size={16} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      ) : null}

      {suggestedVideos.length > 0 ? (
        <View style={styles.suggested}>
          <Text style={styles.sectionTitle}>{labels.suggested}</Text>
          <FlatList
            horizontal
            data={suggestedVideos}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestedList}
            renderItem={({ item }) => (
              <VideoCard
                video={item}
                horizontal
                onPress={() => onVideo(item.id)}
                onFavorite={() => onFavoriteVideo(item.id)}
              />
            )}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingHorizontal: COMPACT.hPad,
    paddingTop: COMPACT.gapSm,
    gap: 8,
  },
  glassWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#7B4DFF',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  glassFallback: {
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  glassAndroid: {
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  glassInner: {
    paddingHorizontal: COMPACT.cardPad + 2,
    paddingVertical: COMPACT.cardPad + 2,
    position: 'relative',
  },
  glassTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2D1F52',
    lineHeight: 24,
    paddingRight: 24,
    letterSpacing: -0.2,
  },
  glassChannel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7B6B9E',
    marginTop: 6,
  },
  decorStar: {
    position: 'absolute',
    top: 8,
    right: 10,
    fontSize: COMPACT.decorSize,
    opacity: 0.8,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(123, 77, 255, 0.1)',
    padding: 8,
    gap: 6,
    shadowColor: '#7B4DFF',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionChip: {
    flex: 1,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 10,
    backgroundColor: '#F8F6FC',
    borderWidth: 1,
    borderColor: 'rgba(123, 77, 255, 0.08)',
    paddingHorizontal: 10,
  },
  actionChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B5B8E',
  },
  actionsDivider: {
    height: 1,
    backgroundColor: 'rgba(123, 77, 255, 0.08)',
    marginHorizontal: 2,
  },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 10,
  },
  channelAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(123, 77, 255, 0.2)',
    overflow: 'hidden',
  },
  channelInitial: {
    color: '#fff',
    fontWeight: '800',
  },
  visitCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  visitChannelName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D1F52',
  },
  visitHint: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND_PRIMARY,
  },
  upNextBorder: {
    borderRadius: 14,
    padding: 1.5,
  },
  upNextInner: {
    height: COMPACT.upNextH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: COMPACT.gapSm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 13,
  },
  upNextThumb: {
    width: 64,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EDE8FF',
  },
  upNextText: {
    flex: 1,
    justifyContent: 'center',
    gap: 1,
  },
  upNextLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND_PRIMARY,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  upNextTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A3278',
    lineHeight: 17,
  },
  upNextPlay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggested: {
    gap: COMPACT.gapSm,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.bodyBold,
    fontSize: 15,
    color: '#4A3278',
  },
  suggestedList: {
    paddingRight: COMPACT.hPad,
    gap: spacing.sm,
  },
});
