import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { spacing, typography, radius } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import { createCheckout, fetchSubscriptionPlans, type SubscriptionPlan } from '../../api/subscriptions';
import { fetchPlatformAccess } from '../../api/parent';
import { useAppStore } from '../../store/useAppStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SubscriptionScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const setPlatformAccess = useAppStore((s) => s.setPlatformAccess);
  const platformAccess = useAppStore((s) => s.platformAccess);
  const dismissSubscriptionPrompt = useAppStore((s) => s.dismissSubscriptionPrompt);
  const login = useAppStore((s) => s.login);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const role = useAppStore((s) => s.role);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const { headerTop } = useAppInsets();
  const scrollBottomPad = useStackScreenPadding();

  const handleContinueFree = () => {
    dismissSubscriptionPrompt();
    setOnboarded(true);
    if (role !== 'parent') {
      login('parent');
    }
    navigation.reset({ index: 0, routes: [{ name: 'ParentTabs' }] });
  };

  useEffect(() => {
    void Promise.all([fetchSubscriptionPlans(), fetchPlatformAccess()])
      .then(([p, access]) => {
        setPlans(p);
        setPlatformAccess(access);
      })
      .finally(() => setLoading(false));
  }, [setPlatformAccess]);

  const handleSubscribe = async (slug: string, planName: string) => {
    setCheckingOut(slug);
    try {
      const result = await createCheckout(slug);
      if (result.activated) {
        const access = await fetchPlatformAccess();
        setPlatformAccess(access);
        Alert.alert('Subscribed!', `${planName} is now active on your account.`, [
          {
            text: 'Continue',
            onPress: () =>
              navigation.reset({ index: 0, routes: [{ name: 'ParentTabs' }] }),
          },
        ]);
        return;
      }
      if (result.url) {
        await Linking.openURL(result.url);
      }
    } catch (err) {
      Alert.alert('Subscription failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setCheckingOut(null);
    }
  };

  if (platformAccess?.hasAccess) {
    return (
      <GradientBackground>
        <View style={styles.center}>
          <Icon name="checkmark-circle" size={56} color={colors.success} />
          <Text style={[styles.title, { color: colors.text }]}>You have access</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {platformAccess.accessType === 'FREE'
              ? `Free access in ${platformAccess.countryName ?? 'your region'}.`
              : 'Your subscription is active.'}
          </Text>
          <Pressable
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'ParentTabs' }] })}
          >
            <Text style={styles.btnText}>Continue</Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: headerTop, paddingBottom: scrollBottomPad }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>KidNest Premium</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          Subscribe to browse content, add videos & channels, and manage your children&apos;s library.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          plans.map((plan) => (
            <View
              key={plan.id}
              style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
              {plan.description ? (
                <Text style={[styles.planDesc, { color: colors.textMuted }]}>{plan.description}</Text>
              ) : null}
              <Text style={[styles.price, { color: colors.primary }]}>
                ${(plan.priceCents / 100).toFixed(2)} / {plan.interval === 'MONTHLY' ? 'month' : 'year'}
              </Text>
              <Pressable
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={() => void handleSubscribe(plan.slug, plan.name)}
                disabled={checkingOut === plan.slug}
              >
                <Text style={styles.btnText}>
                  {checkingOut === plan.slug ? 'Activating…' : 'Subscribe'}
                </Text>
              </Pressable>
            </View>
          ))
        )}

        {!platformAccess?.hasAccess ? (
          <Pressable onPress={handleContinueFree} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Continue free</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  back: { marginBottom: spacing.lg },
  title: { ...typography.h1, marginBottom: spacing.sm },
  sub: { ...typography.body, marginBottom: spacing.xl, lineHeight: 22 },
  planCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  planName: { ...typography.h3, marginBottom: 4 },
  planDesc: { ...typography.caption, marginBottom: spacing.sm },
  price: { ...typography.h2, marginBottom: spacing.md },
  btn: {
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  skipText: { ...typography.body, fontWeight: '600' },
});
