import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import WatchHistoryList from '../../components/history/WatchHistoryList';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { useChildWatchHistory } from '../../hooks/useChildWatchHistory';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { spacing, typography, radius } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function WatchHistoryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const apiChildren = useAppStore((s) => s.apiChildren);
  const activeChildId = useAppStore((s) => s.activeChildId);
  const setActiveChild = useAppStore((s) => s.setActiveChild);
  const { headerTop } = useAppInsets();
  const listBottomPad = useStackScreenPadding();

  const childId = activeChildId ?? apiChildren[0]?.id ?? null;
  const { history, loading, reload } = useChildWatchHistory(childId);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const openVideo = (videoId: string) => {
    navigation.navigate('VideoPlayer', { videoId });
  };

  return (
    <GradientBackground variant="subtle">
      <Text style={[styles.title, { color: colors.text, paddingTop: headerTop }]}>
        {t('history')}
      </Text>

      {apiChildren.length > 1 ? (
        <FlatList
          horizontal
          data={apiChildren}
          keyExtractor={(c) => c.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.childPicker}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setActiveChild(item.id)}
              style={[
                styles.childChip,
                {
                  backgroundColor: childId === item.id ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: childId === item.id ? '#fff' : colors.text,
                  fontWeight: '600',
                }}
              >
                {item.user.displayName}
              </Text>
            </Pressable>
          )}
        />
      ) : null}

      <WatchHistoryList
        history={history}
        loading={loading}
        onVideoPress={openVideo}
        listBottomPad={listBottomPad}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  childPicker: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  childChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
});
