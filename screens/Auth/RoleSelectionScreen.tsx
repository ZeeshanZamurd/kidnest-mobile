import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import SafeScreen from '../../components/layout/SafeScreen';
import AppLogo from '../../components/brand/AppLogo';
import GradientBackground from '../../components/ui/GradientBackground';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { radius, spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RoleSelection'>;

export default function RoleSelectionScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const login = useAppStore((s) => s.login);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  const selectParent = () => {
    setOnboarded(true);
    login('parent');
    navigation.reset({
      index: 0,
      routes: [{ name: 'ParentTabs' }],
    });
  };

  const selectChild = () => {
    setOnboarded(true);
    login('child', 'child-1');
    navigation.reset({ index: 0, routes: [{ name: 'ChildTabs' }] });
  };

  return (
    <GradientBackground>
      <SafeScreen edges={['top', 'bottom']}>
        <View style={styles.container}>
        <AppLogo size={72} style={styles.logo} />
        <Text style={[styles.title, { color: colors.text }]}>{t('select_role')}</Text>

        <Pressable
          onPress={selectParent}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.icon, { backgroundColor: colors.primary + '18' }]}>
            <Icon name="people" size={32} color={colors.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('role_parent')}</Text>
            <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{t('role_parent_desc')}</Text>
          </View>
          <Icon name="chevron-forward" size={24} color={colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={selectChild}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.icon, { backgroundColor: colors.childPrimary + '22' }]}>
            <Icon name="happy" size={32} color={colors.childPrimary} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('role_child')}</Text>
            <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{t('role_child_desc')}</Text>
          </View>
          <Icon name="chevron-forward" size={24} color={colors.textMuted} />
        </Pressable>
        </View>
      </SafeScreen>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  logo: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { ...typography.h3, marginBottom: 4 },
  cardDesc: { ...typography.caption, lineHeight: 18 },
});
