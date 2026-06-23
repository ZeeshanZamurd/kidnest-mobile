import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AvatarPicker from '../../components/profile/AvatarPicker';
import GradientBackground from '../../components/ui/GradientBackground';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { avatarKeyForIndex, type AvatarKey } from '../../constants/avatars';
import { fetchParentDashboard } from '../../api/parent';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useStackScreenPadding } from '../../hooks/useScreenPadding';
import { createChildProfile, refreshParentChildren } from '../../services/childService';
import { useAppStore } from '../../store/useAppStore';
import { radius, spacing, typography } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddChild'>;

export default function AddChildScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { headerTop } = useAppInsets();
  const bottomPad = useStackScreenPadding();
  const setApiChildren = useAppStore((s) => s.setApiChildren);

  const [name, setName] = useState('');
  const [age, setAge] = useState('6');
  const [avatarKey, setAvatarKey] = useState<AvatarKey>(avatarKeyForIndex(0));
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [maxChildren, setMaxChildren] = useState<number | null>(null);
  const [currentCount, setCurrentCount] = useState(0);

  useEffect(() => {
    void fetchParentDashboard()
      .then((dash) => {
        setMaxChildren(dash.limits.maxChildren);
        setCurrentCount(dash.usage.children);
      })
      .catch(() => {});
  }, []);

  const atLimit = maxChildren != null && currentCount >= maxChildren;

  const validate = (): number | null => {
    setNameError(null);
    setAgeError(null);
    setFormError(null);

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameError(t('name_required'));
      return null;
    }

    const parsedAge = parseInt(age, 10);
    if (!Number.isFinite(parsedAge) || parsedAge < 1 || parsedAge > 17) {
      setAgeError(t('age_required'));
      return null;
    }

    if (atLimit) {
      setFormError(t('child_limit_reached'));
      return null;
    }

    return parsedAge;
  };

  const handleSubmit = async () => {
    const parsedAge = validate();
    if (parsedAge == null) return;

    setLoading(true);
    try {
      await createChildProfile({
        displayName: name.trim(),
        age: parsedAge,
        avatarKey,
      });
      const children = await refreshParentChildren();
      setApiChildren(children);
      navigation.goBack();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('add_child_error');
      if (message.toLowerCase().includes('limit')) {
        setFormError(t('child_limit_reached'));
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground variant="subtle">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: headerTop, paddingBottom: bottomPad },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
              <Icon name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={[styles.title, { color: colors.text }]}>{t('add_child_title')}</Text>
            <View style={styles.backBtn} />
          </View>

          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('add_child_desc')}</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('child_name')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
              placeholder={t('child_name_placeholder')}
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: nameError ? colors.danger : colors.border,
                },
              ]}
            />
            {nameError ? (
              <Text style={[styles.fieldError, { color: colors.danger }]}>{nameError}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('child_age')}</Text>
            <TextInput
              value={age}
              onChangeText={(text) => setAge(text.replace(/\D/g, '').slice(0, 2))}
              keyboardType="number-pad"
              editable={!loading}
              placeholder="6"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                styles.ageInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: ageError ? colors.danger : colors.border,
                },
              ]}
            />
            {ageError ? (
              <Text style={[styles.fieldError, { color: colors.danger }]}>{ageError}</Text>
            ) : null}
          </View>

          <AvatarPicker selected={avatarKey} onSelect={setAvatarKey} />

          {formError ? (
            <View style={[styles.errorBox, { backgroundColor: colors.danger + '18' }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{formError}</Text>
              {atLimit ? (
                <PrimaryButton
                  label={t('view_subscription')}
                  variant="ghost"
                  onPress={() => navigation.navigate('Subscription')}
                  style={styles.limitBtn}
                />
              ) : null}
            </View>
          ) : null}

          <PrimaryButton
            label={t('create_profile')}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || atLimit}
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h2 },
  subtitle: { ...typography.body, marginBottom: spacing.lg, textAlign: 'center' },
  field: { marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typography.body,
  },
  ageInput: { maxWidth: 120, textAlign: 'center' },
  fieldError: { ...typography.tiny, marginTop: 6 },
  errorBox: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, lineHeight: 20 },
  limitBtn: { marginTop: spacing.sm },
  submit: { marginTop: spacing.md },
});
