import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import GradientBackground from '../../components/ui/GradientBackground';
import ChildProfileCard from '../../components/profile/ChildProfileCard';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { useTabScreenPadding } from '../../hooks/useScreenPadding';
import { useAppInsets } from '../../hooks/useAppInsets';
import { spacing, typography } from '../../theme/colors';

export default function ChildProfilesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const children = useAppStore((s) => s.children);
  const activeChildId = useAppStore((s) => s.activeChildId);
  const setActiveChild = useAppStore((s) => s.setActiveChild);
  const toggleChildPause = useAppStore((s) => s.toggleChildPause);
  const { headerTop } = useAppInsets();
  const listBottomPad = useTabScreenPadding();

  return (
    <GradientBackground variant="subtle">
      <View style={[styles.header, { paddingTop: headerTop }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('child_profiles')}</Text>
        <PrimaryButton label={t('add_child')} onPress={() => {}} style={styles.addBtn} />
      </View>
      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        renderItem={({ item }) => (
          <ChildProfileCard
            child={item}
            selected={item.id === activeChildId}
            onPress={() => setActiveChild(item.id)}
            onTogglePause={() => toggleChildPause(item.id)}
          />
        )}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg },
  title: { ...typography.h1, marginBottom: spacing.md },
  addBtn: { alignSelf: 'flex-start', marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.md },
});
