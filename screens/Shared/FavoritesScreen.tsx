import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import VideoCard from '../../components/video/VideoCard';
import EmptyState from '../../components/ui/EmptyState';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { getFavorites } from '../../data/mockData';
import { useTabScreenPadding } from '../../hooks/useScreenPadding';
import { useAppInsets } from '../../hooks/useAppInsets';
import { spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const videos = useAppStore((s) => s.videos);
  const toggleFavorite = useAppStore((s) => s.toggleVideoFavorite);
  const { headerTop } = useAppInsets();
  const listBottomPad = useTabScreenPadding();

  const favorites = useMemo(() => {
    const fromStore = videos.filter((v) => v.isFavorite && v.status === 'approved');
    return fromStore.length > 0 ? fromStore : getFavorites();
  }, [videos]);

  if (favorites.length === 0) {
    return (
      <GradientBackground variant="child">
        <EmptyState
          icon="heart-outline"
          title={t('no_favorites')}
          description={t('no_favorites_desc')}
        />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="child">
      <Text style={[styles.title, { color: colors.text, paddingTop: headerTop }]}>{t('favorites')}</Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
            onFavorite={() => toggleFavorite(item.id)}
          />
        )}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.md },
});
