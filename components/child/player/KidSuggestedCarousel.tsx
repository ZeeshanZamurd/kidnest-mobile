import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import ChildKidVideoCard from '../ChildKidVideoCard';
import { themeForCategory } from '../categoryThemes';
import { spacing, typography } from '../../../theme/colors';
import type { Video } from '../../../types';

type Props = {
  title: string;
  videos: Video[];
  onPressVideo: (videoId: string) => void;
  onFavorite?: (videoId: string) => void;
};

export default function KidSuggestedCarousel({
  title,
  videos,
  onPressVideo,
  onFavorite,
}: Props) {
  if (videos.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{title}</Text>
      <FlatList
        horizontal
        data={videos}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ChildKidVideoCard
            video={item}
            theme={themeForCategory(item.category)}
            carousel
            onPress={() => onPressVideo(item.id)}
            onFavorite={onFavorite ? () => onFavorite(item.id) : undefined}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  heading: {
    ...typography.h3,
    color: '#3D2A7A',
    fontWeight: '800',
    paddingHorizontal: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
});
