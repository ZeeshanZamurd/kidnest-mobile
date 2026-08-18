import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { ensureStripeInitialized } from '../../services/stripeInit';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../../components/ui/GradientBackground';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { spacing, typography, radius } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import {
  confirmStripePayment,
  createPaymentSheet,
  fetchSubscriptionPlans,
  fetchSubscriptionStatus,
  PREMIUM_FEATURES,
  redeemPromoCode,
  type SubscriptionPlan,
  type SubscriptionStatusResponse,
} from '../../api/subscriptions';
import { fetchPlatformAccess } from '../../api/parent';
import { useAppStore } from '../../store/useAppStore';
import { KidAlert } from '../../services/kidAlert';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function UsageRow({
  label,
  used,
  max,
  colors,
}: {
  label: string;
  used: number;
  max: number;
  colors: { text: string; textMuted: string; primary: string; border: string; surface: string };
}) {
  const pct = max > 0 ? Math.min(1, used / max) : 0;
  const left = Math.max(0, max - used);
  return (
    <View style={styles.usageRow}>
      <View style={styles.usageHead}>
        <Text style={[styles.usageLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.usageCount, { color: colors.textMuted }]}>
          {used} / {max} · {left} left
        </Text>
      </View>
      <View style={[styles.usageTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.usageFill, { width: `${pct * 100}%`, backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

export default function SubscriptionScreen() {
  const { colors } = useTheme();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const navigation = useNavigation<Nav>();
  const setPlatformAccess = useAppStore((s) => s.setPlatformAccess);
  const platformAccess = useAppStore((s) => s.platformAccess);
  const dismissSubscriptionPrompt = useAppStore((s) => s.dismissSubscriptionPrompt);
  const login = useAppStore((s) => s.login);
  const role = useAppStore((s) => s.role);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [redeemingPromo, setRedeemingPromo] = useState(false);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string | null>(null);
  const { headerTop } = useAppInsets();
  const scrollBottomPad = useStackScreenPadding();

  const hasPaidSubscription = status?.hasSubscription === true;
  const hasFreeRegionalAccess =
    !hasPaidSubscription && platformAccess?.accessType === 'FREE' && platformAccess?.hasAccess;

  useEffect(() => {
    void Promise.all([fetchSubscriptionPlans(), fetchSubscriptionStatus(), fetchPlatformAccess()])
      .then(([p, s, access]) => {
        setPlans(p);
        setStatus(s);
        setPlatformAccess(access);
        const monthly = p.find((plan) => plan.interval === 'MONTHLY');
        setSelectedPlanSlug(monthly?.slug ?? p[0]?.slug ?? null);
      })
      .finally(() => setLoading(false));
  }, [setPlatformAccess]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.slug === selectedPlanSlug) ?? plans[0] ?? null,
    [plans, selectedPlanSlug],
  );

  const monthlyPlan = useMemo(() => plans.find((plan) => plan.interval === 'MONTHLY'), [plans]);
  const yearlyPlan = useMemo(() => plans.find((plan) => plan.interval === 'YEARLY'), [plans]);

  useFocusEffect(
    useCallback(() => {
      if (loading) return;
      void Promise.all([fetchSubscriptionStatus(), fetchPlatformAccess()]).then(([s, access]) => {
        setStatus(s);
        setPlatformAccess(access);
      });
    }, [loading, setPlatformAccess]),
  );

  const activePlanName = useMemo(() => {
    if (status?.subscription?.plan?.name) return status.subscription.plan.name;
    if (platformAccess?.subscription?.planName) return platformAccess.subscription.planName;
    if (platformAccess?.accessType === 'FREE') return 'Free region access';
    return null;
  }, [status, platformAccess]);

  const handleSubscribe = async (slug: string) => {
    setCheckingOut(slug);
    try {
      const params = await createPaymentSheet(slug);
      await ensureStripeInitialized(params.publishableKey);
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'KidNest',
        customerId: params.customerId,
        customerEphemeralKeySecret: params.ephemeralKey,
        paymentIntentClientSecret: params.paymentIntentClientSecret,
        allowsDelayedPaymentMethods: false,
      });
      if (initError) {
        throw new Error(initError.message);
      }

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== 'Canceled') {
          KidAlert.alert('Payment failed', presentError.message);
        }
        return;
      }

      const result = await confirmStripePayment(params.subscriptionId);
      if (result.activated) {
        setStatus(result);
        const access = await fetchPlatformAccess();
        setPlatformAccess(access);
        KidAlert.alert('Subscribed!', 'Your premium plan is now active.', [
          { text: 'Continue', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      const [access, sub] = await Promise.all([fetchPlatformAccess(), fetchSubscriptionStatus()]);
      setPlatformAccess(access);
      setStatus(sub);
    } catch (err) {
      KidAlert.alert('Subscription failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setCheckingOut(null);
    }
  };

  const handleRedeemPromo = async () => {
    const code = promoCode.trim();
    if (!code) {
      KidAlert.alert('Enter a code', 'Type your promo code to continue.');
      return;
    }
    setRedeemingPromo(true);
    try {
      const subscription = await redeemPromoCode(code);
      const [access, sub] = await Promise.all([fetchPlatformAccess(), fetchSubscriptionStatus()]);
      setPlatformAccess(access);
      setStatus(sub);
      setPromoCode('');
      KidAlert.alert(
        'Promo applied!',
        `${subscription.plan.name} is active until ${subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'the end of your period'}.`,
        [{ text: 'Continue', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      KidAlert.alert('Invalid code', err instanceof Error ? err.message : 'Try again');
    } finally {
      setRedeemingPromo(false);
    }
  };

  const limits = status?.limits;
  const usage = status?.usage;

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerTop, paddingBottom: scrollBottomPad },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <Text style={[styles.title, { color: colors.text }]}>KidNest Premium</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          Free videos are available to everyone. Premium content, unlimited channels, and family
          features require a subscription.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {hasPaidSubscription && activePlanName ? (
              <View style={[styles.currentCard, { backgroundColor: colors.primary + '14', borderColor: colors.primary }]}>
                <Icon name="checkmark-circle" size={28} color={colors.success} />
                <View style={styles.currentBody}>
                  <Text style={[styles.currentTitle, { color: colors.text }]}>Current plan</Text>
                  <Text style={[styles.currentPlan, { color: colors.primary }]}>{activePlanName}</Text>
                  {status?.subscription?.currentPeriodEnd ? (
                    <Text style={[styles.currentMeta, { color: colors.textMuted }]}>
                      {status.subscription.status === 'EXPIRED'
                        ? `Expired ${new Date(status.subscription.currentPeriodEnd).toLocaleDateString()}`
                        : `Active until ${new Date(status.subscription.currentPeriodEnd).toLocaleDateString()}`}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : hasFreeRegionalAccess ? (
              <View style={[styles.currentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Icon name="globe-outline" size={28} color={colors.primary} />
                <View style={styles.currentBody}>
                  <Text style={[styles.currentTitle, { color: colors.text }]}>Free regional access</Text>
                  <Text style={[styles.currentMeta, { color: colors.textMuted }]}>
                    Upgrade to Premium for unlimited channels, assignments, and premium content.
                  </Text>
                </View>
              </View>
            ) : null}

            {limits && usage ? (
              <View style={[styles.usageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Your usage</Text>
                <UsageRow label="Child profiles" used={usage.children} max={limits.maxChildren} colors={colors} />
                <UsageRow label="Channels assigned" used={usage.channels} max={limits.maxChannels} colors={colors} />
                <UsageRow label="Video assignments" used={usage.assignments} max={limits.maxAssignments} colors={colors} />
                <Pressable
                  style={[styles.addChildBtn, { borderColor: colors.primary }]}
                  onPress={() => navigation.navigate('AddChild')}
                >
                  <Icon name="person-add" size={18} color={colors.primary} />
                  <Text style={[styles.addChildText, { color: colors.primary }]}>Add child profile</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Premium includes</Text>
              {PREMIUM_FEATURES.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Icon name="checkmark-circle" size={18} color={colors.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                </View>
              ))}

              {!hasPaidSubscription && plans.length > 0 && selectedPlan ? (
                <>
                  <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

                  <View style={[styles.intervalRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {monthlyPlan ? (
                      <Pressable
                        style={[
                          styles.intervalOption,
                          selectedPlan.slug === monthlyPlan.slug && {
                            backgroundColor: colors.primary,
                          },
                        ]}
                        onPress={() => setSelectedPlanSlug(monthlyPlan.slug)}
                      >
                        <Text
                          style={[
                            styles.intervalLabel,
                            { color: selectedPlan.slug === monthlyPlan.slug ? '#fff' : colors.text },
                          ]}
                        >
                          Monthly
                        </Text>
                        <Text
                          style={[
                            styles.intervalPrice,
                            {
                              color:
                                selectedPlan.slug === monthlyPlan.slug ? '#fff' : colors.textMuted,
                            },
                          ]}
                        >
                          ${(monthlyPlan.priceCents / 100).toFixed(2)}/mo
                        </Text>
                      </Pressable>
                    ) : null}
                    {yearlyPlan ? (
                      <Pressable
                        style={[
                          styles.intervalOption,
                          selectedPlan.slug === yearlyPlan.slug && {
                            backgroundColor: colors.primary,
                          },
                        ]}
                        onPress={() => setSelectedPlanSlug(yearlyPlan.slug)}
                      >
                        <Text
                          style={[
                            styles.intervalLabel,
                            { color: selectedPlan.slug === yearlyPlan.slug ? '#fff' : colors.text },
                          ]}
                        >
                          Yearly
                        </Text>
                        <Text
                          style={[
                            styles.intervalPrice,
                            {
                              color:
                                selectedPlan.slug === yearlyPlan.slug ? '#fff' : colors.textMuted,
                            },
                          ]}
                        >
                          ${(yearlyPlan.priceCents / 100).toFixed(2)}/yr
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <Text style={[styles.planLimits, { color: colors.textMuted }]}>
                    Up to {selectedPlan.maxChildren} children · {selectedPlan.maxChannels} channels ·{' '}
                    {selectedPlan.maxVideos} videos
                  </Text>

                  <Pressable
                    style={[styles.btn, { backgroundColor: colors.primary }]}
                    onPress={() => void handleSubscribe(selectedPlan.slug)}
                    disabled={checkingOut === selectedPlan.slug}
                  >
                    <Text style={styles.btnText}>
                        {checkingOut === selectedPlan.slug ? 'Processing…' : `Subscribe — $${(selectedPlan.priceCents / 100).toFixed(2)}/${selectedPlan.interval === 'MONTHLY' ? 'month' : 'year'}`}
                    </Text>
                  </Pressable>
                </>
              ) : null}
            </View>

            {!hasPaidSubscription ? (
              <>
                {plans.length === 0 ? (
                  <Text style={[styles.emptyPlans, { color: colors.textMuted }]}>
                    Subscription plans are being set up. Try again later or use a promo code below.
                  </Text>
                ) : null}

                <View style={[styles.promoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Have a promo code?</Text>
                  <TextInput
                    style={[styles.promoInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                    placeholder="Enter code"
                    placeholderTextColor={colors.textMuted}
                    value={promoCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    onChangeText={setPromoCode}
                  />
                  <Pressable
                    style={[styles.btn, { backgroundColor: colors.primary }]}
                    onPress={() => void handleRedeemPromo()}
                    disabled={redeemingPromo}
                  >
                    <Text style={styles.btnText}>{redeemingPromo ? 'Applying…' : 'Apply promo code'}</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => {
                    dismissSubscriptionPrompt();
                    if (role !== 'parent') login('parent');
                    navigation.goBack();
                  }}
                  style={styles.skipBtn}
                >
                  <Text style={[styles.skipText, { color: colors.textMuted }]}>Continue with free access</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={[styles.btn, { backgroundColor: colors.primary, marginTop: spacing.md }]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.btnText}>Done</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  back: { marginBottom: spacing.lg },
  title: { ...typography.h1, marginBottom: spacing.sm },
  sub: { ...typography.body, marginBottom: spacing.lg, lineHeight: 22 },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  currentBody: { flex: 1, gap: 2 },
  currentTitle: { ...typography.caption, fontWeight: '600' },
  currentPlan: { ...typography.h3 },
  currentMeta: { ...typography.caption },
  usageCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: { ...typography.h3, marginBottom: spacing.xs },
  usageRow: { gap: 6 },
  usageHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  usageLabel: { ...typography.bodyBold, fontSize: 14 },
  usageCount: { ...typography.caption },
  usageTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  usageFill: { height: '100%', borderRadius: 3 },
  addChildBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  addChildText: { fontWeight: '700', fontSize: 14 },
  featuresCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  featureText: { ...typography.body, flex: 1, lineHeight: 22 },
  cardDivider: { height: 1, marginVertical: spacing.md },
  emptyPlans: { ...typography.body, marginBottom: spacing.lg, lineHeight: 22 },
  intervalRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.md,
    gap: 4,
  },
  intervalOption: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  intervalLabel: { fontWeight: '700', fontSize: 14 },
  intervalPrice: { fontSize: 12, marginTop: 2 },
  promoCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  promoInput: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    letterSpacing: 1,
  },
  planLimits: { ...typography.caption, marginBottom: spacing.md, marginTop: spacing.xs },
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
