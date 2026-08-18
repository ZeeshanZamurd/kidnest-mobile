import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import WatchHistoryList from '../../components/history/WatchHistoryList';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { useChildWatchHistory } from '../../hooks/useChildWatchHistory';
import { useChildLibrary } from '../../hooks/useChildLibrary';
import { useTabScreenPadding } from '../../hooks/useScreenPadding';
import { useAppInsets } from '../../hooks/useAppInsets';
import { spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import { openChildVideo } from '../../utils/childVideoNavigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ChildWatchHistoryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const activeChildId = useAppStore((s) => s.activeChildId);
  const { history, loading, error, reload } = useChildWatchHistory(activeChildId);
  const { feedVideos } = useChildLibrary(activeChildId);
  const { headerTop } = useAppInsets();
  const listBottomPad = useTabScreenPadding();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const openVideo = (videoId: string) => {
    const meta = feedVideos.find((v) => v.id === videoId);
    openChildVideo(navigation, { id: videoId, contentType: meta?.contentType });
  };

  return (
    <GradientBackground variant="child">
      <Text style={[styles.title, { color: colors.text, paddingTop: headerTop }]}>
        {t('history')}
      </Text>
      <WatchHistoryList
        history={history}
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        onVideoPress={openVideo}
        listBottomPad={listBottomPad}
        variant="child"
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
});
