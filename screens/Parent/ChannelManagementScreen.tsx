import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import GradientBackground from '../../components/ui/GradientBackground';
import ChannelCard from '../../components/channel/ChannelCard';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useTheme } from '../../context/ThemeContext';
import { useChannels } from '../../store/useAppStore';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { spacing, typography } from '../../theme/colors';

export default function ChannelManagementScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const channels = useChannels();
  const { headerTop } = useAppInsets();
  const listBottomPad = useStackScreenPadding();

  return (
    <GradientBackground variant="subtle">
      <View style={[styles.header, { paddingTop: headerTop }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('manage_channels')}</Text>
        <PrimaryButton label={t('sync_channels')} onPress={() => {}} style={styles.syncBtn} />
      </View>
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
        renderItem={({ item }) => <ChannelCard channel={item} onToggleApprove={() => {}} />}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h1, marginBottom: spacing.md },
  syncBtn: { alignSelf: 'flex-start' },
  list: { paddingHorizontal: spacing.md },
});
