import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AppLogo from '../../components/brand/AppLogo';
import ProfileCard from '../../components/profile/ProfileCard';
import ParentPinModal from '../../components/profile/ParentPinModal';
import GradientBackground from '../../components/ui/GradientBackground';
import { fetchParentChildren } from '../../api/parent';
import { type AvatarKey } from '../../constants/avatars';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
import type { RootStackParamList } from '../../navigation/types';
import { getChildProfileMeta } from '../../services/childProfileMetaStorage';
import { verifyParentPin } from '../../services/parentPinStorage';
import { useAppStore } from '../../store/useAppStore';
import { spacing, typography } from '../../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ProfileSelection'>;

type WatchProfile = {
  id: string;
  name: string;
  age?: number;
  avatarKey: AvatarKey;
  isPaused: boolean;
};

export default function ProfileSelectionScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { headerTop, stackBottom } = useAppInsets();
  const parentSession = useAppStore((s) => s.parentSession);
  const setApiChildren = useAppStore((s) => s.setApiChildren);
  const login = useAppStore((s) => s.login);

  const [profiles, setProfiles] = useState<WatchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinVisible, setPinVisible] = useState(false);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const apiChildren = await fetchParentChildren();
      setApiChildren(apiChildren);

      const mapped = await Promise.all(
        apiChildren.map(async (child, index) => {
          const meta = await getChildProfileMeta(child.id, index);
          return {
            id: child.id,
            name: child.user.displayName,
            age: child.age > 0 ? child.age : undefined,
            avatarKey: meta.avatarKey,
            isPaused: child.isPaused,
          };
        }),
      );
      setProfiles(mapped);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [setApiChildren]);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const parentUserId = parentSession?.backendUser.id ?? '';

  const handleChildSelect = (profile: WatchProfile) => {
    if (profile.isPaused) return;
    login('child', profile.id);
    navigation.reset({ index: 0, routes: [{ name: 'ChildTabs' }] });
  };

  const handleParentSelect = () => {
    setPinVisible(true);
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    const ok = await verifyParentPin(parentUserId, pin);
    if (!ok) return false;
    setPinVisible(false);
    login('parent');
    navigation.reset({ index: 0, routes: [{ name: 'ParentTabs' }] });
    return true;
  };

  const profileRows = useMemo(() => {
    const rows: WatchProfile[][] = [];
    for (let i = 0; i < profiles.length; i += 2) {
      rows.push(profiles.slice(i, i + 2));
    }
    return rows;
  }, [profiles]);

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerTop + spacing.lg, paddingBottom: stackBottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <AppLogo size={72} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{t('who_is_watching')}</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
        ) : (
          <>
            {profiles.length === 0 ? (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyWrap}>
                <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {t('profile_selection_empty_title')}
                  </Text>
                  <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                    {t('profile_selection_empty_desc')}
                  </Text>
                </View>
              </Animated.View>
            ) : (
              profileRows.map((row, rowIndex) => (
                <Animated.View
                  key={`row-${rowIndex}`}
                  entering={FadeInDown.delay(rowIndex * 80).duration(400)}
                  style={styles.row}
                >
                  {row.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      name={profile.name}
                      avatarKey={profile.avatarKey}
                      subtitle={
                        profile.isPaused
                          ? t('profile_paused')
                          : profile.age
                            ? t('age_years', { count: profile.age })
                            : undefined
                      }
                      disabled={profile.isPaused}
                      onPress={() => handleChildSelect(profile)}
                    />
                  ))}
                  {row.length === 1 ? <View style={styles.rowSpacer} /> : null}
                </Animated.View>
              ))
            )}

            <Animated.View
              entering={FadeInDown.delay(profiles.length === 0 ? 80 : profileRows.length * 80 + 60).duration(400)}
            >
              <View style={styles.parentRow}>
                <ProfileCard
                  name={t('parent_dashboard')}
                  variant="parent"
                  fullWidth
                  subtitle={t('parent_dashboard_desc')}
                  onPress={handleParentSelect}
                />
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>

      <ParentPinModal
        visible={pinVisible}
        onClose={() => setPinVisible(false)}
        onSubmit={handlePinSubmit}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.hero,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  loader: { marginTop: spacing.xxl },
  emptyWrap: {
    marginBottom: spacing.lg,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  emptyDesc: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    justifyContent: 'center',
  },
  rowSpacer: { flex: 1, maxWidth: '48%' },
  parentRow: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
});
