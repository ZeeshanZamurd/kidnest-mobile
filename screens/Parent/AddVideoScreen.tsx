import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import GradientBackground from '../../components/ui/GradientBackground';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { radius, spacing, typography } from '../../theme/colors';

export default function AddVideoScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [url, setUrl] = useState('https://youtube.com/watch?v=example');
  const { headerTop } = useAppInsets();
  const scrollBottomPad = useStackScreenPadding();

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: headerTop, paddingBottom: scrollBottomPad }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('add_video')}</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Paste a YouTube video, channel, or playlist URL. Metadata will be fetched automatically.
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>YouTube URL</Text>
        <TextInput
          value={url}
          onChangeText={setUrl}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          autoCapitalize="none"
        />

        <PrimaryButton label={t('add_channel')} onPress={() => navigation.goBack()} style={styles.btn} />
        <PrimaryButton label={t('back')} variant="outline" onPress={() => navigation.goBack()} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  title: { ...typography.h1, marginBottom: spacing.sm },
  hint: { ...typography.body, marginBottom: spacing.xl, lineHeight: 22 },
  label: { ...typography.caption, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...typography.body,
    marginBottom: spacing.xl,
  },
  btn: { marginBottom: spacing.md },
});
