import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { KidAlert } from '../../services/kidAlert';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { useAppStore } from '../../store/useAppStore';
import {
  fetchChildBlockedApps,
  updateChildBlockedApps,
  type InstalledApp,
} from '../../api/appBlock';
import {
  getAppBlockDeviceInfo,
  getInstalledApps,
  hasAccessibilityPermission,
  hasAppListPermission,
  isAppBlockSupported,
  openAccessibilitySettings,
  openAppListPermissionSettings,
} from '../../services/appBlockNative';
import { cacheBlockedApps } from '../../services/appBlockCache';
import { applyDeviceBlockList } from '../../services/appBlockSync';
import { getAccessibilitySetupSteps } from '../../services/appBlockDeviceHints';
import { radius, spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AppBlockingScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { headerTop } = useAppInsets();
  const listBottomPad = useStackScreenPadding();
  const apiChildren = useAppStore((s) => s.apiChildren);
  const activeChildId = useAppStore((s) => s.activeChildId);
  const setActiveChild = useAppStore((s) => s.setActiveChild);

  const childId = activeChildId ?? apiChildren[0]?.id ?? null;

  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [blockedSet, setBlockedSet] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessibilityGranted, setAccessibilityGranted] = useState(false);
  const [appListGranted, setAppListGranted] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [setupSteps, setSetupSteps] = useState<string[]>(getAccessibilitySetupSteps());
  const [isOnePlusFamily, setIsOnePlusFamily] = useState(false);

  useEffect(() => {
    void getAppBlockDeviceInfo().then((info) => {
      if (info) {
        setSetupSteps(getAccessibilitySetupSteps(info.manufacturer, info.brand));
        const m = `${info.manufacturer} ${info.brand}`.toLowerCase();
        setIsOnePlusFamily(m.includes('oneplus') || m.includes('oppo') || m.includes('realme'));
      }
    });
  }, []);

  const load = useCallback(async () => {
    if (!childId || !isAppBlockSupported) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [apps, blocked, hasAccess, listGranted] = await Promise.all([
        getInstalledApps(),
        fetchChildBlockedApps(childId),
        hasAccessibilityPermission(),
        hasAppListPermission(),
      ]);

      const canReadApps = apps.length > 0 || listGranted;
      setAppListGranted(canReadApps);
      setInstalledApps(apps.sort((a, b) => a.appLabel.localeCompare(b.appLabel)));
      setBlockedSet(new Set(blocked.map((b) => b.packageName)));
      setAccessibilityGranted(hasAccess);
    } catch (err) {
      KidAlert.alert(
        'Could not load apps',
        err instanceof Error ? err.message : 'Try again',
      );
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    return () => sub.remove();
  }, [load]);

  useEffect(() => {
    void load();
  }, [childId, load]);

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return installedApps;
    return installedApps.filter(
      (app) =>
        app.appLabel.toLowerCase().includes(q) || app.packageName.toLowerCase().includes(q),
    );
  }, [installedApps, search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const toggleApp = (packageName: string) => {
    setBlockedSet((prev) => {
      const next = new Set(prev);
      if (next.has(packageName)) next.delete(packageName);
      else next.add(packageName);
      return next;
    });
  };

  const handleSave = async () => {
    if (!childId) return;
    setSaving(true);
    try {
      const apps = installedApps
        .filter((app) => blockedSet.has(app.packageName))
        .map((app) => ({ packageName: app.packageName, appLabel: app.appLabel }));
      await updateChildBlockedApps(childId, apps);
      const packageNames = apps.map((app) => app.packageName);
      await cacheBlockedApps(childId, packageNames);
      applyDeviceBlockList(packageNames);
      KidAlert.alert(
        'Saved!',
        `${apps.length} app${apps.length === 1 ? '' : 's'} blocked. Switch to child profile to enforce blocks.`,
      );
    } catch (err) {
      KidAlert.alert('Save failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setSaving(false);
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <GradientBackground variant="subtle">
        <View style={[styles.center, { paddingTop: headerTop }]}>
          <Icon name="phone-portrait-outline" size={48} color={colors.primary} />
          <Text style={[styles.iosTitle, { color: colors.text }]}>Android only</Text>
          <Text style={[styles.iosDesc, { color: colors.textMuted }]}>
            App blocking requires Android. iOS does not allow third-party apps to block other apps.
          </Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Go back</Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  if (!isAppBlockSupported) {
    return (
      <GradientBackground variant="subtle">
        <View style={[styles.header, { paddingTop: headerTop }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Block apps</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.center, { paddingTop: spacing.xl }]}>
          <Icon name="build-outline" size={48} color={colors.primary} />
          <Text style={[styles.iosTitle, { color: colors.text }]}>Rebuild required</Text>
          <Text style={[styles.iosDesc, { color: colors.textMuted }]}>
            Rebuild the Android app to enable app blocking:{'\n'}
            cd kidnest-mobile && npx react-native run-android
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="subtle">
      <View style={[styles.header, { paddingTop: headerTop }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Block apps</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={[styles.sub, { color: colors.textMuted }]}>
        Choose apps your child cannot open while using this device in child mode.
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
              <Text style={{ color: childId === item.id ? '#fff' : colors.text, fontWeight: '600' }}>
                {item.user.displayName}
              </Text>
            </Pressable>
          )}
        />
      ) : null}

      {!appListGranted && !loading ? (
        <View style={[styles.permissionCard, { backgroundColor: colors.primary + '18', borderColor: colors.primary }]}>
          <Icon name="apps-outline" size={22} color={colors.primary} />
          <View style={styles.permissionBody}>
            <Text style={[styles.permissionTitle, { color: colors.text }]}>Apps not loading</Text>
            <Text style={[styles.permissionDesc, { color: colors.textMuted }]}>
              {isOnePlusFamily
                ? 'If you already allowed Read app list in Settings, pull down to refresh. Otherwise open app permissions and allow it for KidNest.'
                : 'Allow KidNest to read installed apps, then pull down to refresh.'}
            </Text>
            <Pressable
              onPress={() => {
                void openAppListPermissionSettings().then(() => void load());
              }}
              style={[styles.permissionBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.permissionBtnText}>Open settings</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {accessibilityGranted ? (
        <View style={[styles.permissionCard, { backgroundColor: colors.primary + '14', borderColor: colors.primary }]}>
          <Icon name="checkmark-circle" size={22} color={colors.primary} />
          <View style={styles.permissionBody}>
            <Text style={[styles.permissionTitle, { color: colors.text }]}>Accessibility enabled</Text>
            <Text style={[styles.permissionDesc, { color: colors.textMuted }]}>
              KidNest can block apps in child mode. Select apps below and tap Save.
            </Text>
          </View>
        </View>
      ) : null}

      {!accessibilityGranted ? (
        <View style={[styles.permissionCard, { backgroundColor: colors.warning + '18', borderColor: colors.warning }]}>
          <Icon name="shield-checkmark-outline" size={22} color={colors.warning} />
          <View style={styles.permissionBody}>
            <Text style={[styles.permissionTitle, { color: colors.text }]}>Enable KidNest accessibility</Text>
            <Text style={[styles.permissionDesc, { color: colors.textMuted }]}>
              {isOnePlusFamily
                ? 'On OnePlus, app blocking is not a separate menu — enable KidNest under Installed services:'
                : 'Allow KidNest accessibility so blocked apps can be enforced in child mode:'}
            </Text>
            {setupSteps.map((step, index) => (
              <Text key={step} style={[styles.stepText, { color: colors.textMuted }]}>
                {index + 1}. {step}
              </Text>
            ))}
            <Pressable
              onPress={() => {
                void openAccessibilitySettings().then((opened) => {
                  if (!opened) {
                    KidAlert.alert(
                      'Open manually',
                      'Settings → Additional settings → Accessibility → Installed services → KidNest → ON',
                    );
                  }
                });
              }}
              style={[styles.permissionBtn, { backgroundColor: colors.warning }]}
            >
              <Text style={styles.permissionBtnText}>Open settings</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <TextInput
        style={[styles.search, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
        placeholder="Search apps…"
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredApps}
          keyExtractor={(item) => item.packageName}
          contentContainerStyle={{ paddingBottom: listBottomPad + 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            !loading ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {accessibilityGranted && !appListGranted
                  ? 'Allow Read app list in Settings → Privacy, then pull down to refresh.'
                  : accessibilityGranted
                    ? 'No apps found. Pull down to refresh.'
                    : 'Enable accessibility above, then pull down to refresh.'}
              </Text>
            ) : null
          }
          renderItem={({ item }) => {
            const blocked = blockedSet.has(item.packageName);
            return (
              <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.appIcon, { backgroundColor: colors.primary + '18' }]}>
                  <Text style={[styles.appIconText, { color: colors.primary }]}>
                    {item.appLabel.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.rowMeta}>
                  <Text style={[styles.appName, { color: colors.text }]} numberOfLines={1}>
                    {item.appLabel}
                  </Text>
                  <Text style={[styles.packageName, { color: colors.textMuted }]} numberOfLines={1}>
                    {item.packageName}
                  </Text>
                </View>
                <Switch
                  value={blocked}
                  onValueChange={() => toggleApp(item.packageName)}
                  trackColor={{ true: colors.danger, false: colors.border }}
                  thumbColor="#fff"
                />
              </View>
            );
          }}
        />
      )}

      <View style={[styles.footer, { paddingBottom: listBottomPad, backgroundColor: colors.background }]}>
        <PrimaryButton
          label={saving ? 'Saving…' : `Save (${blockedSet.size} blocked)`}
          onPress={() => void handleSave()}
          loading={saving}
          disabled={!childId || loading}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: { ...typography.h2 },
  sub: {
    ...typography.body,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  childPicker: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  childChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  permissionCard: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  permissionBody: { flex: 1, gap: 6 },
  permissionTitle: { ...typography.bodyBold },
  permissionDesc: { ...typography.caption, lineHeight: 18 },
  stepText: { ...typography.caption, lineHeight: 18, marginTop: 2 },
  permissionBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  permissionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  search: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: { fontSize: 18, fontWeight: '800' },
  rowMeta: { flex: 1 },
  appName: { ...typography.bodyBold, fontSize: 15 },
  packageName: { ...typography.tiny },
  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  iosTitle: { ...typography.h2 },
  iosDesc: { ...typography.body, textAlign: 'center', lineHeight: 22 },
  backLink: { marginTop: spacing.md },
});
