import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  findNodeHandle,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import GradientBackground from '../../components/ui/GradientBackground';
import PrimaryButton from '../../components/ui/PrimaryButton';
import AppLogo from '../../components/brand/AppLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
import { radius, spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import PinInputField from '../../components/auth/PinInputField';
import SecureTextInput from '../../components/ui/SecureTextInput';
import { loginParent, signUpParent } from '../../services/authService';
import { setApiAuthToken } from '../../api/client';
import { isValidPin, saveParentPin } from '../../services/parentPinStorage';
import { loadParentChildren } from '../../services/parentChildrenCache';
import { useAppStore } from '../../store/useAppStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

type FocusedField = 'name' | 'email' | 'password' | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FOCUS_SCROLL_OFFSET = 28;

function mapAuthErrorMessage(message: string, t: (key: string) => string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes('invalid email or password') ||
    lower.includes('wrong-password') ||
    lower.includes('invalid-credential') ||
    lower.includes('user-not-found')
  ) {
    return t('auth_error_invalid_credentials');
  }
  if (
    lower.includes('network') ||
    lower.includes("can't reach") ||
    lower.includes('fetch failed') ||
    lower.includes('connection')
  ) {
    return t('auth_error_network');
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return t('auth_error_timeout');
  }

  return message || t('auth_error_generic');
}

export default function AuthScreen() {
  const { t } = useTranslation(undefined, { useSuspense: false });
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { headerTop, stackBottom } = useAppInsets();
  const setParentSession = useAppStore((s) => s.setParentSession);

  const scrollRef = useRef<ScrollView>(null);
  const scrollContentRef = useRef<View>(null);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [confirmPinError, setConfirmPinError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollFieldIntoView = useCallback((target: View | null) => {
    if (!target || !scrollRef.current || !scrollContentRef.current) return;
    const scrollNode = findNodeHandle(scrollContentRef.current);
    if (!scrollNode) return;

    // Defer until keyboard has started resizing the window
    requestAnimationFrame(() => {
      target.measureLayout(
        scrollNode,
        (_x, y) => {
          scrollRef.current?.scrollTo({
            y: Math.max(0, y - FOCUS_SCROLL_OFFSET),
            animated: true,
          });
        },
        () => undefined,
      );
    });
  }, []);

  const onFieldFocus = useCallback(
    (field: FocusedField) =>
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        setFocusedField(field);
        const node = e.target as unknown as View;
        setTimeout(() => scrollFieldIntoView(node), Platform.OS === 'ios' ? 50 : 120);
      },
    [scrollFieldIntoView],
  );

  const labelColor = colors.text;
  const subtitleColor = colors.textSecondary;

  const inputBorder = (focused: boolean) => ({
    borderColor: focused ? colors.primary : colors.border,
    borderWidth: focused ? 1.5 : 1,
  });

  const handleSubmit = async () => {
    setError(null);
    setPinError(null);
    setConfirmPinError(null);
    setEmailError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError(t('auth_email_invalid'));
      return;
    }

    if (!isLogin) {
      if (!isValidPin(pin)) {
        setPinError(t('pin_invalid'));
        return;
      }
      if (pin !== confirmPin) {
        setConfirmPinError(t('pin_mismatch'));
        return;
      }
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      const session = isLogin
        ? await loginParent({ email: trimmedEmail, password })
        : await signUpParent({ name, email: trimmedEmail, password });

      setParentSession(
        { backendUser: session.backendUser, idToken: session.idToken },
        session.platformAccess,
      );
      setApiAuthToken(session.idToken);
      void loadParentChildren();

      if (!isLogin) {
        await saveParentPin(session.backendUser.id, pin);
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'ProfileSelection' }],
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : t('auth_error_generic');
      setError(mapAuthErrorMessage(raw, t));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setError(null);
    setEmailError(null);
    setPin('');
    setConfirmPin('');
    setPinError(null);
    setConfirmPinError(null);
    Keyboard.dismiss();
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleForgotPassword = () => {
    Alert.alert(t('auth_forgot_password'), t('auth_forgot_password_soon'));
  };

  const bottomPad =
    stackBottom +
    spacing.lg +
    (keyboardHeight > 0 ? Math.max(keyboardHeight * 0.15, spacing.xl) : spacing.xl);

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerTop : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: headerTop + spacing.sm,
              paddingBottom: bottomPad,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentInsetAdjustmentBehavior="always"
        >
          <View ref={scrollContentRef} collapsable={false}>
            <Animated.View
              entering={FadeInDown.duration(400).delay(40)}
              style={[styles.hero, !isLogin && styles.heroCompact]}
            >
              <AppLogo size={isLogin ? LOGO_SIZES.auth : LOGO_SIZES.profileSelection} shadow={false} />
              <Text style={[styles.heading, { color: colors.text }]}>
                {isLogin ? t('welcome_back') : t('create_account')}
              </Text>
              <Text style={[styles.sub, { color: subtitleColor }]}>
                {isLogin ? t('tagline') : t('auth_signup_subtitle')}
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(400).delay(100)}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.text,
                },
              ]}
            >
              {!isLogin && (
                <View style={styles.field}>
                  <Text style={[styles.label, { color: labelColor }]}>{t('full_name')}</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoComplete="name"
                    editable={!loading}
                    placeholder={t('auth_placeholder_name')}
                    placeholderTextColor={colors.textMuted}
                    onFocus={onFieldFocus('name')}
                    onBlur={() => setFocusedField(null)}
                    style={[
                      styles.input,
                      inputBorder(focusedField === 'name'),
                      { backgroundColor: colors.background, color: colors.text },
                    ]}
                  />
                </View>
              )}

              <View style={styles.field}>
                <Text style={[styles.label, { color: labelColor }]}>{t('email')}</Text>
                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (emailError) setEmailError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  editable={!loading}
                  placeholder={t('auth_placeholder_email')}
                  placeholderTextColor={colors.textMuted}
                  onFocus={onFieldFocus('email')}
                  onBlur={() => setFocusedField(null)}
                  style={[
                    styles.input,
                    inputBorder(focusedField === 'email'),
                    { backgroundColor: colors.background, color: colors.text },
                    emailError ? { borderColor: colors.danger, borderWidth: 1.5 } : null,
                  ]}
                />
                {emailError ? (
                  <Text style={[styles.fieldError, { color: colors.danger }]}>{emailError}</Text>
                ) : null}
              </View>

              <View style={styles.field}>
                <View style={styles.passwordHeader}>
                  <Text style={[styles.label, styles.labelInline, { color: labelColor }]}>
                    {t('password')}
                  </Text>
                  {isLogin ? (
                    <Pressable
                      onPress={handleForgotPassword}
                      disabled={loading}
                      hitSlop={8}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.forgotLink, { color: colors.primary }]}>
                        {t('auth_forgot_password')}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <SecureTextInput
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  autoComplete={isLogin ? 'password' : 'new-password'}
                  textContentType={isLogin ? 'password' : 'newPassword'}
                  placeholder={t('auth_placeholder_password')}
                  placeholderTextColor={colors.textMuted}
                  onFocus={(e) => {
                    setPasswordFocused(true);
                    const node = e.target as unknown as View;
                    setTimeout(() => scrollFieldIntoView(node), Platform.OS === 'ios' ? 50 : 120);
                  }}
                  onBlur={() => setPasswordFocused(false)}
                  style={[
                    styles.input,
                    inputBorder(passwordFocused),
                    { backgroundColor: colors.background, color: colors.text },
                  ]}
                />
              </View>

              {!isLogin && (
                <View style={styles.pinBlock}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    {t('auth_pin_section')}
                  </Text>
                  <PinInputField
                    label={t('parent_pin_create')}
                    value={pin}
                    onChangeText={setPin}
                    error={pinError}
                    editable={!loading}
                    showHint
                    onFocusScroll={scrollFieldIntoView}
                  />
                  <PinInputField
                    label={t('parent_pin_confirm')}
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    error={confirmPinError}
                    editable={!loading}
                    showHint={false}
                    onFocusScroll={scrollFieldIntoView}
                  />
                </View>
              )}

              {error ? (
                <View
                  style={[
                    styles.errorBox,
                    {
                      backgroundColor: colors.danger + '12',
                      borderColor: colors.danger + '40',
                    },
                  ]}
                >
                  <Icon name="alert-circle" size={18} color={colors.danger} style={styles.errorIcon} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              ) : null}

              <PrimaryButton
                label={isLogin ? t('login') : t('register')}
                loadingLabel={isLogin ? t('auth_signing_in') : t('auth_creating_account')}
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.submit}
              />
            </Animated.View>

            <View style={styles.switchRow}>
              <Text style={[styles.switchPrompt, { color: subtitleColor }]}>
                {isLogin ? t('auth_no_account') : t('auth_have_account')}
              </Text>
              <Pressable onPress={toggleMode} disabled={loading} hitSlop={8} accessibilityRole="button">
                <Text style={[styles.switchLink, { color: colors.primary }]}>
                  {isLogin ? t('register') : t('login')}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'flex-start',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  heroCompact: {
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.h2,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  sub: {
    ...typography.caption,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  card: {
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  field: { marginBottom: spacing.md },
  pinBlock: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.tiny,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelInline: {
    marginBottom: 0,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  forgotLink: {
    ...typography.caption,
    fontWeight: '600',
  },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    ...typography.body,
  },
  fieldError: {
    ...typography.caption,
    marginTop: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorIcon: {
    marginRight: spacing.sm,
    marginTop: 1,
  },
  errorText: {
    ...typography.caption,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  submit: { marginTop: spacing.xs, marginBottom: spacing.sm },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  switchPrompt: {
    ...typography.body,
    fontWeight: '500',
  },
  switchLink: {
    ...typography.bodyBold,
  },
});
