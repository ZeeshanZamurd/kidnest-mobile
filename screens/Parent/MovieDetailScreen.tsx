import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
import { spacing, typography, radius } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import { fetchMovieDetail, type MovieDetail } from '../../api/movies';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, 'MovieDetail'>;

export default function MovieDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { headerTop } = useAppInsets();
  const { tmdbId, mediaType = 'movie', queueIds = [], queueTypes = [] } =
    route.params;

  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDetail(await fetchMovieDetail(tmdbId, mediaType));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [tmdbId, mediaType]);

  useEffect(() => {
    void load();
  }, [load]);

  const playTrailer = () => {
    if (!detail?.trailerYoutubeId) return;
    navigation.navigate('MovieTrailerPlayer', {
      tmdbId: detail.id,
      title: detail.title,
      trailerYoutubeId: detail.trailerYoutubeId,
      mediaType: detail.mediaType,
      queueIds,
      queueTypes,
    });
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={{ paddingTop: headerTop }}>
          <Pressable style={styles.back} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : error || !detail ? (
          <Text style={[styles.error, { color: '#c62828' }]}>
            {error ?? 'Movie not found'}
          </Text>
        ) : (
          <>
            <ImageBackground
              source={{
                uri: detail.backdropUrl || detail.posterUrl || undefined,
              }}
              style={styles.hero}
            >
              <View style={styles.scrim} />
            </ImageBackground>
            <View style={styles.body}>
              <Text style={[styles.title, { color: colors.text }]}>{detail.title}</Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {[detail.year, detail.runtimeMinutes ? `${detail.runtimeMinutes} min` : null]
                  .filter(Boolean)
                  .join(' · ')}
                {detail.rating ? ` · ★ ${detail.rating.toFixed(1)}` : ''}
              </Text>
              {detail.genres.length > 0 && (
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {detail.genres.join(' · ')}
                </Text>
              )}
              <Text style={[styles.overview, { color: colors.text }]}>{detail.overview}</Text>

              <Pressable
                style={[
                  styles.cta,
                  {
                    backgroundColor: detail.trailerYoutubeId
                      ? colors.primary
                      : colors.card,
                  },
                ]}
                disabled={!detail.trailerYoutubeId}
                onPress={playTrailer}
              >
                <Icon
                  name="play"
                  size={20}
                  color={detail.trailerYoutubeId ? '#fff' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.ctaText,
                    { color: detail.trailerYoutubeId ? '#fff' : colors.textMuted },
                  ]}
                >
                  {detail.trailerYoutubeId ? 'Play trailer' : 'No trailer available'}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  back: {
    marginLeft: spacing.md,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    height: 220,
    marginTop: spacing.sm,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  body: {
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
    fontSize: 26,
    fontWeight: '800',
  },
  meta: {
    ...typography.caption,
    marginTop: 6,
  },
  overview: {
    ...typography.body,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  cta: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  ctaText: {
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    padding: spacing.lg,
    ...typography.body,
  },
});
