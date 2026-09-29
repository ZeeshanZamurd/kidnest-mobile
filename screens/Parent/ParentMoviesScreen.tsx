import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
import { spacing, typography, radius } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import {
  fetchMovieCatalog,
  type MovieCard,
  type MovieCatalogRow,
} from '../../api/movies';
import { useAppStore } from '../../store/useAppStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ParentMoviesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { headerTop } = useAppInsets();
  const moviesEnabled = useAppStore((s) => s.platformAccess?.moviesSectionEnabled === true);

  const [rows, setRows] = useState<MovieCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hero = useMemo(() => {
    for (const row of rows) {
      const withArt = row.items.find((i) => i.backdropUrl || i.posterUrl);
      if (withArt) return withArt;
    }
    return null;
  }, [rows]);

  const load = useCallback(async () => {
    if (!moviesEnabled) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMovieCatalog();
      setRows(data.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [moviesEnabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const openMovie = (item: MovieCard, queue: MovieCard[]) => {
    navigation.navigate('MovieDetail', {
      tmdbId: item.id,
      title: item.title,
      mediaType: item.mediaType,
      queueIds: queue.map((q) => q.id),
      queueTypes: queue.map((q) => q.mediaType),
    });
  };

  if (!moviesEnabled) {
    return (
      <GradientBackground>
        <View style={[styles.centered, { paddingTop: headerTop + spacing.xl }]}>
          <Icon name="film-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Movies unavailable</Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
            An admin can enable the Movies section in KidoNest Settings.
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl * 2 }}
        showsVerticalScrollIndicator={false}
      >
        {hero?.backdropUrl || hero?.posterUrl ? (
          <ImageBackground
            source={{ uri: (hero.backdropUrl || hero.posterUrl)! }}
            style={[styles.hero, { paddingTop: headerTop + spacing.md }]}
          >
            <View style={styles.heroScrim}>
              <Text style={styles.heroEyebrow}>TRENDING NOW</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {hero.title}
              </Text>
              <Pressable
                style={[styles.playBtn, { backgroundColor: colors.primary }]}
                onPress={() => openMovie(hero, rows[0]?.items ?? [hero])}
              >
                <Icon name="play" size={18} color="#fff" />
                <Text style={styles.playBtnText}>View</Text>
              </Pressable>
            </View>
          </ImageBackground>
        ) : (
          <View style={{ height: headerTop + spacing.xl }} />
        )}

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} />
        ) : error ? (
          <Text style={[styles.error, { color: '#c62828' }]}>{error}</Text>
        ) : (
          rows.map((row) => (
            <View key={row.id} style={styles.rowBlock}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{row.title}</Text>
              <FlatList
                horizontal
                data={row.items}
                keyExtractor={(item) => String(item.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.md }}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.posterCard}
                    onPress={() => openMovie(item, row.items)}
                  >
                    {item.posterUrl ? (
                      <Image source={{ uri: item.posterUrl }} style={styles.poster} />
                    ) : (
                      <View style={[styles.poster, styles.posterFallback, { backgroundColor: colors.card }]}>
                        <Icon name="film-outline" size={28} color={colors.textMuted} />
                      </View>
                    )}
                    <Text style={[styles.posterTitle, { color: colors.text }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          ))
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.title,
    marginTop: spacing.md,
  },
  emptyBody: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  hero: {
    height: 320,
    justifyContent: 'flex-end',
  },
  heroScrim: {
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  playBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  playBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  rowBlock: {
    marginTop: spacing.lg,
  },
  rowTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  posterCard: {
    width: 120,
    marginRight: spacing.sm,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: radius.md,
  },
  posterFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterTitle: {
    ...typography.caption,
    marginTop: 6,
  },
  error: {
    padding: spacing.lg,
    ...typography.body,
  },
});
