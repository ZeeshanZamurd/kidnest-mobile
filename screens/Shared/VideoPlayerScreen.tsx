import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchVideoById, formatDuration, type VideoDetail } from '../../api/browse';
import { typography, radius, spacing } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';

const { width, height } = Dimensions.get('window');

type Route = RouteProp<RootStackParamList, 'VideoPlayer'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function resolveWatchUrl(video: VideoDetail): string | null {
  if (video.youtubeUrl) return video.youtubeUrl;
  if (video.youtubeVideoId) {
    return video.contentType === 'SHORT'
      ? `https://www.youtube.com/shorts/${video.youtubeVideoId}`
      : `https://www.youtube.com/watch?v=${video.youtubeVideoId}`;
  }
  return null;
}

export default function VideoPlayerScreen() {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    setPaused(false);
    void fetchVideoById(route.params.videoId)
      .then(setVideo)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load video');
        setVideo(null);
      })
      .finally(() => setLoading(false));
  }, [route.params.videoId]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setPaused(true);
      };
    }, []),
  );

  const openChannel = () => {
    if (!video) return;
    setPaused(true);
    navigation.navigate('ChannelDetail', { channelId: video.channelId });
  };

  const isShort = video?.contentType === 'SHORT';
  const streamUri = video?.streamUrl ?? null;
  const watchUrl = useMemo(() => (video ? resolveWatchUrl(video) : null), [video]);

  const openExternal = () => {
    if (!watchUrl) return;
    void Linking.openURL(watchUrl);
  };

  if (loading) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (!video || error) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>{error || 'Video not found'}</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const renderPlayer = () => {
    if (streamUri) {
      return (
        <Pressable style={styles.videoWrap} onPress={() => setPaused(!paused)}>
          <Video
            source={{ uri: streamUri }}
            style={[
              styles.video,
              isShort && !fullscreen ? styles.shortVideo : null,
              fullscreen ? styles.videoFullscreen : null,
            ]}
            resizeMode={isShort ? 'cover' : 'contain'}
            paused={paused}
            poster={video.thumbnailUrl ?? undefined}
            posterResizeMode="cover"
            controls
            repeat
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
          />
          {!paused ? null : (
            <View style={styles.playOverlay}>
              <Icon name="play-circle" size={72} color="rgba(255,255,255,0.9)" />
            </View>
          )}
        </Pressable>
      );
    }

    return (
      <Pressable style={styles.videoWrap} onPress={openExternal}>
        <Image source={{ uri: video.thumbnailUrl ?? '' }} style={[styles.video, isShort && styles.shortVideo]} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.externalPlay}>
          <View style={styles.externalPlayCircle}>
            <Icon name="logo-youtube" size={36} color="#fff" />
          </View>
          <Text style={styles.externalPlayText}>Tap to watch on YouTube</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, fullscreen && styles.fullscreen, isShort && styles.shortContainer]}>
      <Pressable
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
      >
        <Icon name="chevron-back" size={28} color="#fff" />
      </Pressable>

      {isShort && (
        <View style={[styles.shortBadge, { top: insets.top + 12 }]}>
          <Icon name="flash" size={12} color="#fff" />
          <Text style={styles.shortBadgeText}>Short</Text>
        </View>
      )}

      {renderPlayer()}

      {!fullscreen && (
        <ScrollView
          style={styles.infoScroll}
          contentContainerStyle={[styles.info, { paddingBottom: insets.bottom + 16 }]}
        >
          <Text style={styles.title}>{video.title}</Text>
          <Pressable style={styles.channelRow} onPress={openChannel}>
            <Icon name="albums-outline" size={18} color="#c4b5fd" />
            <Text style={styles.channel}>{video.channelName}</Text>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
          </Pressable>
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Icon name={isShort ? 'flash' : 'film-outline'} size={14} color="#fff" />
              <Text style={styles.metaPillText}>{isShort ? 'Short' : 'Video'}</Text>
            </View>
            {video.durationSecs ? (
              <View style={styles.metaPill}>
                <Icon name="time-outline" size={14} color="#fff" />
                <Text style={styles.metaPillText}>{formatDuration(video.durationSecs)}</Text>
              </View>
            ) : null}
          </View>
          {video.description ? (
            <Text style={styles.description}>{video.description}</Text>
          ) : null}
          <View style={styles.actions}>
            {streamUri ? (
              <Pressable onPress={() => setFullscreen(true)} style={styles.action}>
                <Icon name="expand" size={22} color="#fff" />
                <Text style={styles.actionText}>{t('fullscreen')}</Text>
              </Pressable>
            ) : watchUrl ? (
              <Pressable onPress={openExternal} style={styles.action}>
                <Icon name="open-outline" size={22} color="#fff" />
                <Text style={styles.actionText}>Open in YouTube</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      )}

      {fullscreen && (
        <Pressable style={[styles.exitFullscreen, { top: insets.top + 8 }]} onPress={() => setFullscreen(false)}>
          <Icon name="contract" size={28} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  shortContainer: { backgroundColor: '#0a0a0a' },
  fullscreen: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: 24 },
  fallbackText: { color: '#fff', textAlign: 'center', marginBottom: 16 },
  backLink: { padding: 12 },
  backLinkText: { color: '#a78bfa', fontWeight: '600' },
  backBtn: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortBadge: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(236, 72, 153, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  shortBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  videoWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  video: { width, aspectRatio: 16 / 9 },
  shortVideo: {
    width: Math.min(width * 0.72, 320),
    aspectRatio: 9 / 16,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  videoFullscreen: { width: '100%', height: '100%', aspectRatio: undefined },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  externalPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  externalPlayCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalPlayText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  infoScroll: { maxHeight: height * 0.38 },
  info: { padding: spacing.lg, gap: 10 },
  title: { ...typography.h3, color: '#fff' },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channel: { ...typography.body, color: '#c4b5fd', flex: 1, fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  metaPillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  description: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 20,
  },
  actions: { flexDirection: 'row', gap: 24, marginTop: 4 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: '#fff', ...typography.caption, fontWeight: '600' },
  exitFullscreen: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
});
