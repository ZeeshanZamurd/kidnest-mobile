import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import ChildKidVideoCard from './ChildKidVideoCard';
import type { ChildSectionTheme } from './categoryThemes';
import type { Video } from '../../types';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  title: string;
  theme: ChildSectionTheme;
  videos: Video[];
  onPressVideo: (videoId: string) => void;
  onFavorite?: (videoId: string) => void;
  horizontal?: boolean;
};

/** Simple shelf header + video row/grid — follows app light/dark theme. */
export default function ChildColorSection({
  title,
  theme,
  videos,
  onPressVideo,
  onFavorite,
  horizontal = false,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (videos.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>{theme.emoji}</Text>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {title || t(theme.labelKey)}
        </Text>
      </View>

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
    marginBottom: 20,
  },
  header: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  horizontalItem: {
    width: 152,
    marginRight: 12,
  },
});
