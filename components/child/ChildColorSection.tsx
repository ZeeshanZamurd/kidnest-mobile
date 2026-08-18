import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import ChildKidVideoCard from './ChildKidVideoCard';
import type { ChildSectionTheme } from './categoryThemes';
import type { Video } from '../../types';

type Props = {
  title: string;
  theme: ChildSectionTheme;
  videos: Video[];
  onPressVideo: (videoId: string) => void;
  onFavorite?: (videoId: string) => void;
  horizontal?: boolean;
};

/** Color-blocked content row — icon-only header, no reading required for navigation. */
export default function ChildColorSection({
  title,
  theme,
  videos,
  onPressVideo,
  onFavorite,
  horizontal = false,
}: Props) {
  const { t } = useTranslation();

  if (videos.length === 0) return null;

  return (
    <View style={styles.section}>
      <LinearGradient colors={theme.gradient} style={styles.header}>
        <Text style={styles.headerEmoji}>{theme.emoji}</Text>
        <Text style={styles.headerTitle}>{title || t(theme.labelKey)}</Text>
      </LinearGradient>

      {horizontal ? (
        <FlatList
          horizontal
          data={videos}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <View style={styles.horizontalItem}>
              <ChildKidVideoCard
                video={item}
                theme={theme}
                carousel
                onPress={() => onPressVideo(item.id)}
                onFavorite={onFavorite ? () => onFavorite(item.id) : undefined}
              />
            </View>
          )}
        />
      ) : (
        <View style={styles.grid}>
          {videos.map((video) => (
            <ChildKidVideoCard
              key={video.id}
              video={video}
              theme={theme}
              onPress={() => onPressVideo(video.id)}
              onFavorite={onFavorite ? () => onFavorite(video.id) : undefined}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  header: {
    marginHorizontal: 16,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    shadowColor: '#7B4DFF',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  horizontalItem: {
    width: 180,
  },
});
