import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import {
  fetchMovieDetail,
  fetchSimilarMovies,
  type MovieCard,
} from '../../api/movies';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, 'MovieTrailerPlayer'>;

export default function MovieTrailerPlayerScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const {
    tmdbId,
    title,
    trailerYoutubeId,
    mediaType = 'movie',
    queueIds = [],
    queueTypes = [],
  } = route.params;

  const [queue, setQueue] = useState<MovieCard[]>([]);
  const [loadingNext, setLoadingNext] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const similar = await fetchSimilarMovies(tmdbId, mediaType);
        if (cancelled) return;
        const fromQueue: MovieCard[] = [];
        for (let i = 0; i < queueIds.length; i++) {
          const id = queueIds[i];
          if (id === tmdbId) continue;
          fromQueue.push({
            id,
            title: '',
            overview: '',
            posterUrl: null,
            backdropUrl: null,
            rating: 0,
            year: null,
            mediaType: queueTypes[i] ?? mediaType,
            trailerYoutubeId: null,
          });
        }
        setQueue([...fromQueue, ...similar.items.filter((s) => s.id !== tmdbId)]);
      } catch {
        if (!cancelled) setQueue([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tmdbId, mediaType, queueIds, queueTypes]);

  const embedHtml = useMemo(() => {
    const src = `https://www.youtube-nocookie.com/embed/${trailerYoutubeId}?autoplay=1&rel=0&playsinline=1`;
    return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/><style>html,body{margin:0;padding:0;background:#000;height:100%;}iframe{border:0;position:absolute;inset:0;width:100%;height:100%;}</style></head><body><iframe src="${src}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>`;
  }, [trailerYoutubeId]);

  const playNext = useCallback(async () => {
    if (!queue.length) return;
    setLoadingNext(true);
    try {
      for (const candidate of queue) {
        const detail = await fetchMovieDetail(candidate.id, candidate.mediaType);
        if (detail.trailerYoutubeId) {
          navigation.replace('MovieTrailerPlayer', {
            tmdbId: detail.id,
            title: detail.title,
            trailerYoutubeId: detail.trailerYoutubeId,
            mediaType: detail.mediaType,
            queueIds: queue.map((q) => q.id).filter((id) => id !== detail.id),
            queueTypes: queue
              .filter((q) => q.id !== detail.id)
              .map((q) => q.mediaType),
          });
          return;
        }
      }
    } finally {
      setLoadingNext(false);
    }
  }, [navigation, queue]);

  return (
    <View style={[styles.root, { backgroundColor: '#000', paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="close" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Pressable
          onPress={() => void playNext()}
          disabled={loadingNext || queue.length === 0}
          style={styles.nextBtn}
        >
          {loadingNext ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.nextText}>Play next</Text>
              <Icon name="play-skip-forward" size={20} color="#fff" />
            </>
          )}
        </Pressable>
      </View>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        source={{ html: embedHtml }}
      />
      <Text style={[styles.hint, { color: colors.textMuted, marginBottom: insets.bottom + 8 }]}>
        Official YouTube trailer · not the full movie
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 12,
  },
  title: {
    flex: 1,
    color: '#fff',
    ...typography.subtitle,
    fontWeight: '700',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  nextText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    paddingHorizontal: spacing.md,
  },
});
