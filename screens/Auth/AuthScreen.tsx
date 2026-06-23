import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import GradientBackground from '../../components/ui/GradientBackground';
import PrimaryButton from '../../components/ui/PrimaryButton';
import AppLogo from '../../components/brand/AppLogo';
import { useTheme } from '../../context/ThemeContext';
import { useAppInsets } from '../../hooks/useAppInsets';
import { radius, spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import PinInputField from '../../components/auth/PinInputField';
import { loginParent, signUpParent } from '../../services/authService';
import { setApiAuthToken } from '../../api/client';
import { isValidPin, saveParentPin } from '../../services/parentPinStorage';
import { useAppStore } from '../../store/useAppStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

export default function AuthScreen() {
  const { t } = useTranslation();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setPinError(null);
    setConfirmPinError(null);

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
        ? await loginParent({ email, password })
        : await signUpParent({ name, email, password });

      setParentSession(
        { backendUser: session.backendUser, idToken: session.idToken },
        session.platformAccess,
      );
      setApiAuthToken(session.idToken);

      if (!isLogin) {
        await saveParentPin(session.backendUser.id, pin);
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'ProfileSelection' }],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth_error_generic'));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setError(null);
    setPin('');
    setConfirmPin('');
    setPinError(null);
    setConfirmPinError(null);
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: headerTop, paddingBottom: stackBottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <AppLogo size={96} />
          </View>
          <Text style={[styles.heading, { color: colors.text }]}>
            {isLogin ? t('welcome_back') : t('create_account')}
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>{t('tagline')}</Text>

          {!isLogin && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('full_name')}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!loading}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('email')}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('password')}</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
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
            <View style={[styles.errorBox, { backgroundColor: colors.danger + '18' }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label={isLogin ? t('login') : t('register')}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submit}
          />

          <PrimaryButton
            label={isLogin ? t('register') : t('login')}
            variant="ghost"
            onPress={toggleMode}
            disabled={loading}
          />

          {loading ? (
            <View style={styles.loadingHint}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                {isLogin ? t('auth_signing_in') : t('auth_creating_account')}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heading: { ...typography.hero, marginBottom: spacing.sm, textAlign: 'center' },
  sub: { ...typography.body, marginBottom: spacing.xl, textAlign: 'center' },
  field: { marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typography.body,
  },
  errorBox: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, lineHeight: 20 },
  submit: { marginTop: spacing.md, marginBottom: spacing.sm },
  loadingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  loadingText: { ...typography.caption },
});
