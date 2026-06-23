import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import ChildProfileCard from '../../components/profile/ChildProfileCard';
import PrimaryButton from '../../components/ui/PrimaryButton';
import EmptyState from '../../components/ui/EmptyState';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { useDisplayChildren } from '../../hooks/useDisplayChildren';
import { toggleChildPauseApi } from '../../api/parent';
import { useContentBottomPadding } from '../../hooks/useScreenPadding';
import { useAppInsets } from '../../hooks/useAppInsets';
import { spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ChildProfilesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const activeChildId = useAppStore((s) => s.activeChildId);
  const setActiveChild = useAppStore((s) => s.setActiveChild);
  const { displayChildren, loading, reload } = useDisplayChildren();
  const { headerTop } = useAppInsets();
  const listBottomPad = useContentBottomPadding();

  const handleAddChild = () => {
    navigation.navigate('AddChild');
  };

  const handleTogglePause = async (childId: string) => {
    try {
      await toggleChildPauseApi(childId);
      await reload();
    } catch {
      /* ignore */
    }
  };

  return (
    <GradientBackground variant="subtle">
      <View style={[styles.header, { paddingTop: headerTop }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('child_profiles')}</Text>
        <PrimaryButton label={t('add_child')} onPress={handleAddChild} style={styles.addBtn} />
      </View>

      {!loading && displayChildren.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="people-outline"
            title={t('no_children')}
            description={t('no_children_desc')}
          />
          <PrimaryButton label={t('add_child')} onPress={handleAddChild} style={styles.emptyBtn} />
        </View>
      ) : (
        <FlatList
          data={displayChildren}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
          renderItem={({ item }) => (
            <ChildProfileCard
              child={item}
              selected={item.id === activeChildId}
              onPress={() => setActiveChild(item.id)}
              onTogglePause={() => void handleTogglePause(item.id)}
            />
          )}
          onRefresh={() => void reload()}
          refreshing={loading}
        />
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg },
  title: { ...typography.h1, marginBottom: spacing.md },
  addBtn: { alignSelf: 'flex-start', marginBottom: spacing.md },
  emptyWrap: { flex: 1, paddingHorizontal: spacing.lg },
  emptyBtn: { marginTop: spacing.lg },
  list: { paddingHorizontal: spacing.md },
});
