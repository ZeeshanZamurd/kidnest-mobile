import React, { useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import SectionHeader from '../../components/ui/SectionHeader';
import VideoCard from '../../components/video/VideoCard';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { getContinueWatching, getVideosByChild } from '../../data/mockData';
import { useTabScreenPadding } from '../../hooks/useScreenPadding';
import { useAppInsets } from '../../hooks/useAppInsets';
import { spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ChildHomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const activeChildId = useAppStore((s) => s.activeChildId);
  const children = useAppStore((s) => s.children);
  const toggleFavorite = useAppStore((s) => s.toggleVideoFavorite);

  const child = children.find((c) => c.id === activeChildId) ?? children[0];
  const forYou = useMemo(() => getVideosByChild(child?.id ?? ''), [child?.id]);
  const continueWatching = getContinueWatching();
  const { headerTop } = useAppInsets();
  const scrollBottomPad = useTabScreenPadding();

  return (
    <GradientBackground variant="child">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
      >
        <View style={[styles.header, { paddingTop: headerTop }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {t('learning_fun')}
            </Text>
            <Text style={[styles.name, { color: colors.text }]}>Hi, {child?.name}! 👋</Text>
          </View>
          <View style={[styles.safeBadge, { backgroundColor: colors.success + '22' }]}>
            <Icon name="shield-checkmark" size={16} color={colors.success} />
            <Text style={[styles.safeText, { color: colors.success }]}>{t('safe_mode')}</Text>
          </View>
        </View>

        {continueWatching.length > 0 && (
          <>
            <SectionHeader title={t('continue_watching')} />
            <FlatList
              horizontal
              data={continueWatching}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <VideoCard
                  video={item}
                  horizontal
                  onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
                  onFavorite={() => toggleFavorite(item.id)}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.md }}
            />
          </>
        )}

        <SectionHeader title={t('for_you')} />
        {forYou.map((video) => (
          <View key={video.id} style={{ paddingHorizontal: spacing.md }}>
            <VideoCard
              video={video}
              onPress={() => navigation.navigate('VideoPlayer', { videoId: video.id })}
              onFavorite={() => toggleFavorite(video.id)}
            />
          </View>
        ))}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
  },
  greeting: { ...typography.caption },
  name: { ...typography.h1 },
  safeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  safeText: { ...typography.tiny },
});
