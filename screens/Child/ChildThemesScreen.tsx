import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import ChildColorSection from '../../components/child/ChildColorSection';
import { ChildThemesSkeleton } from '../../components/child/ChildScreenSkeletons';
import { ChildLoadError } from '../../components/child/ChildLoadFeedback';
import EmptyState from '../../components/ui/EmptyState';
import { CATEGORY_THEMES, themeForCategory } from '../../components/child/categoryThemes';
import { useAppStore } from '../../store/useAppStore';
import { useChildLibrary } from '../../hooks/useChildLibrary';
import { useChildFavorites } from '../../hooks/useChildFavorites';
import { useTabScreenPadding } from '../../hooks/useScreenPadding';
import { useAppInsets } from '../../hooks/useAppInsets';
import type { RootStackParamList } from '../../navigation/types';
import type { ContentCategory, Video } from '../../types';
import { openChildVideo } from '../../utils/childVideoNavigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const THEME_ORDER: ContentCategory[] = [
  'stories',
  'science',
  'math',
  'nature',
  'art',
  'music',
  'coding',
];

export default function ChildThemesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const activeChildId = useAppStore((s) => s.activeChildId);
  const { feedVideos, loading, error, hasContent, reload } = useChildLibrary(activeChildId);
  const { toggleVideo } = useChildFavorites(activeChildId);
  const { headerTop } = useAppInsets();
  const scrollBottomPad = useTabScreenPadding();

  const byCategory = useMemo(() => {
    const map = new Map<ContentCategory, Video[]>();
    for (const video of feedVideos) {
      const cat = video.category ?? 'stories';
      const list = map.get(cat) ?? [];
      list.push(video);
      map.set(cat, list);
    }
    return THEME_ORDER.filter((cat) => (map.get(cat)?.length ?? 0) > 0).map((cat) => ({
      category: cat,
      theme: themeForCategory(cat),
      videos: map.get(cat) ?? [],
    }));
  }, [feedVideos]);

  const openVideo = (videoId: string) => {
    const video = feedVideos.find((v) => v.id === videoId);
    openChildVideo(navigation, { id: videoId, contentType: video?.contentType });
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#FAF8FF', '#FFFFFF']} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerTop + 12, paddingBottom: scrollBottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#9B7BFF', CATEGORY_THEMES.stories.color]} style={styles.hero}>
          <Text style={styles.heroEmoji}>🌈</Text>
          <Text style={styles.heroTitle}>{t('child_themes_title')}</Text>
        </LinearGradient>

        {loading ? (
          <ChildThemesSkeleton />
        ) : error && !hasContent ? (
          <ChildLoadError
            title={t('child_load_error')}
            description={t('child_load_error_desc')}
            retryLabel={t('try_again')}
            onRetry={() => void reload()}
          />
        ) : byCategory.length === 0 ? (
          <EmptyState
            branded
            icon="color-palette-outline"
            title={t('no_assigned_videos')}
            description={t('no_assigned_videos_desc')}
          />
        ) : (
          <Animated.View entering={FadeIn.duration(280)}>
            {byCategory.map(({ category, theme, videos }) => (
              <ChildColorSection
                key={category}
                title={t(theme.labelKey)}
                theme={theme}
                videos={videos}
                onPressVideo={openVideo}
                onFavorite={(id) => void toggleVideo(id)}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 0 },
  hero: {
    marginHorizontal: 16,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  heroEmoji: { fontSize: 40 },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
});
