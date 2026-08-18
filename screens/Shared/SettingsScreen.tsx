import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { changeAppLanguage, SUPPORTED_LANGUAGES } from '../../i18n';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { logoutParent } from '../../services/authService';
import { setApiAuthToken } from '../../api/client';
import { useTabScreenPadding } from '../../hooks/useScreenPadding';
import { useAppInsets } from '../../hooks/useAppInsets';
import { radius, spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import { navigateRoot } from '../../navigation/rootNavigation';
import { CacheManager, DEFAULT_VIDEO_CACHE_MB, type CacheStats } from '../../services/cache';
import { getInflightRequestCount } from '../../api/client';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation<Nav>();
  const { headerTop } = useAppInsets();
  const scrollBottomPad = useTabScreenPadding();
  const logout = useAppStore((s) => s.logout);
  const exitProfileMode = useAppStore((s) => s.exitProfileMode);
  const autoplayEnabled = useAppStore((s) => s.autoplayEnabled);
  const setAutoplay = useAppStore((s) => s.setAutoplay);
  const [showLanguages, setShowLanguages] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [clearingCache, setClearingCache] = useState(false);

  const refreshCacheStats = useCallback(() => {
    setCacheStats(CacheManager.getStats(getInflightRequestCount()));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshCacheStats();
    }, [refreshCacheStats]),
  );

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await CacheManager.clearAll();
      refreshCacheStats();
    } finally {
      setClearingCache(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutParent();
    } catch {
      setApiAuthToken(null);
    }
    logout();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  const handleSwitchProfile = () => {
    exitProfileMode();
    navigation.reset({ index: 0, routes: [{ name: 'ProfileSelection' }] });
  };

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    toggle,
  }: {
    icon: string;
    label: string;
    value?: boolean;
    onPress?: () => void;
    toggle?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      disabled={toggle}
    >
      <Icon name={icon} size={22} color={colors.primary} />
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      {toggle && value !== undefined && (
        <Switch value={value} onValueChange={onPress} trackColor={{ true: colors.primary }} />
      )}
      {!toggle && <Icon name="chevron-forward" size={20} color={colors.textMuted} />}
    </Pressable>
  );

  return (
    <GradientBackground variant="subtle">
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: headerTop, paddingBottom: scrollBottomPad }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('settings')}</Text>

        <SettingRow icon="moon" label={t('dark_mode')} value={isDark} toggle onPress={toggleTheme} />
        <SettingRow icon="play" label={t('autoplay')} value={autoplayEnabled} toggle onPress={() => setAutoplay(!autoplayEnabled)} />
        <SettingRow icon="finger-print" label={t('biometric_lock')} value onPress={() => {}} />
        <SettingRow icon="keypad" label={t('parent_pin_setting')} onPress={() => {}} />
        <SettingRow
          icon="language"
          label={t('language')}
          onPress={() => setShowLanguages(!showLanguages)}
        />

        {showLanguages && (
          <View style={styles.langList}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => void changeAppLanguage(lang.code)}
                style={[
                  styles.langItem,
                  {
                    backgroundColor: i18n.language === lang.code ? colors.primary + '18' : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.langText, { color: colors.text }]}>{lang.nativeLabel}</Text>
                {i18n.language === lang.code && (
                  <Icon name="checkmark" size={20} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        )}

        <SettingRow icon="analytics" label={t('analytics')} onPress={() => navigateRoot(navigation, 'Analytics')} />
        <SettingRow icon="time" label={t('history')} onPress={() => navigateRoot(navigation, 'WatchHistory')} />
        {Platform.OS === 'android' ? (
          <SettingRow
            icon="shield-checkmark"
            label="Block apps"
            onPress={() => navigateRoot(navigation, 'AppBlocking')}
          />
        ) : null}
        <SettingRow
          icon="diamond-outline"
          label="Subscription & Premium"
          onPress={() => navigateRoot(navigation, 'Subscription')}
        />

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Storage & cache</Text>
        {cacheStats ? (
          <View style={[styles.cacheCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cacheLine, { color: colors.text }]}>
              API entries: {cacheStats.memoryEntries} memory · {cacheStats.persistedKeys} persisted
            </Text>
            <Text style={[styles.cacheLine, { color: colors.textMuted }]}>
              Image prefetch hits: {cacheStats.imagePrefetchHits} · misses: {cacheStats.imagePrefetchMisses}
            </Text>
            <Text style={[styles.cacheLine, { color: colors.textMuted }]}>
              Video cache budget: ~{DEFAULT_VIDEO_CACHE_MB} MB (native player)
            </Text>
          </View>
        ) : null}
        <Pressable
          onPress={() => void handleClearCache()}
          disabled={clearingCache}
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Icon name="trash-outline" size={22} color={colors.danger} />
          <Text style={[styles.rowLabel, { color: colors.text }]}>Clear cached data</Text>
          {clearingCache ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="chevron-forward" size={20} color={colors.textMuted} />
          )}
        </Pressable>

        <SettingRow
          icon="people"
          label={t('switch_profile')}
          onPress={handleSwitchProfile}
        />

        <PrimaryButton label={t('logout')} variant="outline" onPress={handleLogout} style={styles.logout} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  title: { ...typography.h1, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rowLabel: { flex: 1, ...typography.body },
  sectionLabel: { ...typography.caption, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  cacheCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: 4,
  },
  cacheLine: { ...typography.caption },
  langList: { marginBottom: spacing.md, gap: spacing.sm },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  langText: { ...typography.body },
  logout: { marginTop: spacing.xl },
});
