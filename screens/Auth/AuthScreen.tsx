import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
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

  const labelColor = colors.text;
  const subtitleColor = colors.textSecondary;

  const inputBorder = (focused: boolean) => ({
    borderColor: focused ? colors.primary : colors.border,
    borderWidth: focused ? 2 : 1,
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
  };

  const handleForgotPassword = () => {
    Alert.alert(t('auth_forgot_password'), t('auth_forgot_password_soon'));
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: headerTop, paddingBottom: stackBottom + spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(450).delay(80)} style={styles.hero}>
            <View style={styles.logoWrap}>
              <AppLogo size={LOGO_SIZES.auth} shadow={false} />
            </View>
            <Text style={[styles.heading, { color: colors.text }]}>
              {isLogin ? t('welcome_back') : t('create_account')}
            </Text>
            <Text style={[styles.sub, { color: subtitleColor }]}>{t('tagline')}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(450).delay(160)} style={styles.form}>
            {!isLogin && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: labelColor }]}>{t('full_name')}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!loading}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  style={[
                    styles.input,
                    inputBorder(focusedField === 'name'),
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                    },
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
                editable={!loading}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={[
                  styles.input,
                  inputBorder(focusedField === 'email'),
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                  },
                  emailError ? { borderColor: colors.danger, borderWidth: 2 } : null,
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
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                style={[
                  styles.input,
                  inputBorder(passwordFocused),
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            {!isLogin && (
              <>
                <PinInputField
                  label={t('parent_pin_create')}
                  value={pin}
                  onChangeText={setPin}
                  error={pinError}
                  editable={!loading}
                />
                <PinInputField
                  label={t('parent_pin_confirm')}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  error={confirmPinError}
                  editable={!loading}
                />
              </>
            )}

            {error ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.danger + '14',
                    borderColor: colors.danger + '55',
                  },
                ]}
              >
                <Icon name="alert-circle" size={20} color={colors.danger} style={styles.errorIcon} />
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
          </Animated.View>
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
    justifyContent: 'center',
    minHeight: '100%',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heading: {
    ...typography.hero,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  sub: {
    ...typography.body,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  field: { marginBottom: spacing.md },
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
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
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
    lineHeight: 20,
    fontWeight: '500',
  },
  submit: { marginTop: spacing.sm, marginBottom: spacing.lg },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  switchPrompt: {
    ...typography.body,
    fontWeight: '500',
  },
  switchLink: {
    ...typography.bodyBold,
  },
});
